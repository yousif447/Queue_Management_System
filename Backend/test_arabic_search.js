/**
 * Quick test for Arabic search queries
 * Tests the improved semantic search with hybrid fallback
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api/v1';

function testSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/search/semantic?q=${encodeURIComponent(query)}&limit=10`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Testing Improved Semantic Search (Arabic)      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  const testQueries = [
    'بنك',           // bank
    'عيادة',         // clinic
    'صيدلية',        // pharmacy
    'طبيب',          // doctor
    'مستشفى',        // hospital
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`🔍 Testing: "${query}"`);
      const result = await testSearch(query);
      
      if (result.success) {
        const { businesses, pagination, searchType } = result.data;
        console.log(`   ✅ Found ${businesses.length} results (Total: ${pagination.total})`);
        console.log(`   Search Type: ${searchType}`);
        
        if (businesses.length > 0) {
          console.log(`   Top results:`);
          businesses.slice(0, 3).forEach((b, i) => {
            console.log(`      ${i+1}. ${b.name} - ${b.specialization} (Score: ${b.relevanceScore?.toFixed(3)})`);
          });
        }
      } else {
        console.log(`   ❌ Error: ${result.message}`);
      }
      
      console.log('');
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}\n`);
    }
  }
  
  console.log('✅ Tests completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSearch, runTests };
