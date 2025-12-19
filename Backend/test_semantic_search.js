/**
 * Test file to demonstrate Cohere AI Semantic Search
 * 
 * This script tests the semantic search endpoint with both Arabic and English queries
 * Run this after starting your backend server
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test queries in both languages
const testQueries = {
  english: [
    'dental clinic',
    'hospital',
    'pharmacy',
    'doctor',
    'medical center',
    'bank',
  ],
  arabic: [
    'عيادة أسنان',  // dental clinic
    'مستشفى',       // hospital
    'صيدلية',        // pharmacy
    'طبيب',          // doctor
    'مركز طبي',      // medical center
    'بنك',           // bank
  ],
  relatedConcepts: [
    { query: 'kibbeh', lang: 'English', expectedCategory: 'Syrian/Middle Eastern' },
    { query: 'fattoush', lang: 'English', expectedCategory: 'Syrian/Lebanese' },
    { query: 'كبة', lang: 'Arabic', expectedCategory: 'Syrian/Middle Eastern' },
  ]
};

async function testSemanticSearch(query, language) {
  try {
    const url = `${API_BASE_URL}/search/semantic?q=${encodeURIComponent(query)}&limit=5`;
    
    console.log(`\n🔍 Testing ${language} query: "${query}"`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.data.businesses.length > 0) {
      console.log(`   ✅ Found ${data.data.businesses.length} results:`);
      data.data.businesses.forEach((business, index) => {
        console.log(`      ${index + 1}. ${business.name} (Score: ${business.relevanceScore?.toFixed(3) || 'N/A'})`);
        console.log(`         Specialization: ${business.specialization}`);
      });
    } else {
      console.log(`   ⚠️  No results found`);
    }
    
    return data;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     Cohere AI Semantic Search - Test Suite       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  
  // Test English queries
  console.log('\n📝 Testing English Queries...');
  for (const query of testQueries.english) {
    await testSemanticSearch(query, 'English');
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay to avoid overwhelming
  }
  
  // Test Arabic queries
  console.log('\n\n📝 Testing Arabic Queries...');
  for (const query of testQueries.arabic) {
    await testSemanticSearch(query, 'Arabic');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test Related Concepts
  console.log('\n\n📝 Testing Related Concepts (Query Expansion)...');
  for (const item of testQueries.relatedConcepts) {
    await testSemanticSearch(item.query, `${item.lang} (${item.expectedCategory})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\nNOTE: Make sure your backend server is running on http://localhost:3000');
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testSemanticSearch, runAllTests };
