const { CohereClient } = require('cohere-ai');

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Generate embedding for a single text using Cohere
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Empty text provided for embedding generation');
      return null;
    }

    // Use Cohere's embed API with multilingual model
    const response = await cohere.embed({
      texts: [text.trim()],
      model: 'embed-multilingual-v3.0', // Supports Arabic and English
      inputType: 'search_document', // For indexing documents
    });

    // Return the first (and only) embedding
    return response.embeddings[0];
  } catch (error) {
    console.error('Error generating embedding with Cohere:', error.message);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in batch (more efficient)
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts) {
  try {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter(
      (text) => text && typeof text === 'string' && text.trim().length > 0
    );

    if (validTexts.length === 0) {
      return [];
    }

    // Use Cohere's embed API in batch mode
    const response = await cohere.embed({
      texts: validTexts.map((t) => t.trim()),
      model: 'embed-multilingual-v3.0',
      inputType: 'search_document',
    });

    return response.embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings with Cohere:', error.message);
    return [];
  }
}


/**
 * Expand a search query with related terms using Cohere Chat
 * @param {string} query - Original search query
 * @returns {Promise<string>} - Expanded query string
 */
async function expandQuery(query) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return query;
    }

    // Use Cohere's chat API to generate related terms
    const response = await cohere.chat({
      message: `The user is searching for a business or service with the query: "${query}". Provide 5-10 related keywords, categories, or broader terms. IMPORTANT: If the query is in Arabic, provide keywords in BOTH Arabic and English. If in English, provide in English. Return ONLY the keywords separated by spaces. Do not use commas or bullet points.`,
      model: 'command-light', // Lightweight model, more likely to be available
      temperature: 0.3,   // Low temperature for focused results
    });

    const relatedTerms = response.text.trim();
    console.log(`Query expanded: "${query}" -> "${relatedTerms}"`);
    
    // Return original query + related terms
    return `${query} ${relatedTerms}`;
  } catch (error) {
    console.error('Error expanding query:', error.message);
    // Fallback to original query
    return query;
  }
}

/**
 * Generate query embedding (optimized for search queries)
 * @param {string} query - Search query text
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateQueryEmbedding(query) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('Empty query provided for embedding generation');
      return null;
    }

    // Use Cohere's embed API with search_query input type
    const response = await cohere.embed({
      texts: [query.trim()],
      model: 'embed-multilingual-v3.0',
      inputType: 'search_query', // Optimized for search queries
    });

    return response.embeddings[0];
  } catch (error) {
    console.error('Error generating query embedding with Cohere:', error.message);
    return null;
  }
}

/**
 * Generate all embeddings for a business
 * @param {Object} business - Business object with name, services, specialization
 * @returns {Promise<Object>} - Object with all embeddings
 */
async function generateBusinessEmbeddings(business) {
  try {
    const embeddings = {};
    const textsToEmbed = [];
    const fieldNames = [];

    // Prepare texts for batch embedding
    if (business.name) {
      textsToEmbed.push(business.name);
      fieldNames.push('nameEmbedding');
    }

    if (business.specialization) {
      textsToEmbed.push(business.specialization);
      fieldNames.push('specializationEmbedding');
    }

    // Generate services embedding (combine all service names and descriptions)
    if (business.service && Array.isArray(business.service) && business.service.length > 0) {
      const servicesText = business.service
        .map((s) => `${s.name} ${s.description || ''}`)
        .join(' ');
      textsToEmbed.push(servicesText);
      fieldNames.push('servicesEmbedding');
    }

    // Generate combined embedding (weighted combination for better search)
    if (business.name) {
      const combinedText = [
        business.name,
        business.name, // Weight name more heavily
        business.specialization || '',
        business.service?.map((s) => s.name).join(' ') || '',
      ]
        .filter(Boolean)
        .join(' ');
      
      textsToEmbed.push(combinedText);
      fieldNames.push('combinedEmbedding');
    }

    // Generate all embeddings in one API call (efficient)
    if (textsToEmbed.length > 0) {
      const batchEmbeddings = await generateEmbeddingsBatch(textsToEmbed);
      
      // Map embeddings to field names
      batchEmbeddings.forEach((embedding, index) => {
        if (embedding) {
          embeddings[fieldNames[index]] = embedding;
        }
      });
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating business embeddings:', error);
    return {};
  }
}


/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score between -1 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find most similar businesses to a query
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {Array} businesses - Array of business objects with embeddings
 * @param {number} topK - Number of top results to return
 * @param {number} minSimilarity - Minimum similarity threshold (default: 0.35)
 * @returns {Array} - Array of businesses with similarity scores
 */
function findSimilar(queryEmbedding, businesses, topK = 10, minSimilarity = 0.35) {
  if (!queryEmbedding || !businesses || businesses.length === 0) {
    return [];
  }

  // Calculate similarity for each business
  const results = businesses
    .map((business) => {
      const similarities = [];

      // Check similarity with combined embedding (most important - weighted highest)
      if (business.combinedEmbedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          business.combinedEmbedding
        );
        similarities.push(similarity * 1.5); // Highest weight for combined
      }

      // Check individual embeddings
      if (business.nameEmbedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          business.nameEmbedding
        );
        similarities.push(similarity * 1.3); // Name is important
      }

      if (business.specializationEmbedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          business.specializationEmbedding
        );
        similarities.push(similarity * 1.2); // Specialization matters
      }

      if (business.servicesEmbedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          business.servicesEmbedding
        );
        similarities.push(similarity * 1.0); // Services baseline
      }

      // Use maximum similarity across all embeddings
      const maxSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;

      return {
        business,
        similarity: maxSimilarity,
      };
    })
    .filter((result) => result.similarity >= minSimilarity) // Only return highly relevant results
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
    .slice(0, topK); // Take top K results

  return results;
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateQueryEmbedding,
  generateBusinessEmbeddings,
  cosineSimilarity,
  findSimilar,
  expandQuery,
};

