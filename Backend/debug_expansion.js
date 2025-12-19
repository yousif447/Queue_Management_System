require('dotenv').config();
const { expandQuery } = require('./src/utils/embeddingService');

async function debugArabic() {
    const queries = ['بنك', 'مطعم سوري', 'kibbeh'];
    
    console.log('--- Debugging Query Expansion ---');
    for (const q of queries) {
        try {
            console.log(`\nOriginal: "${q}"`);
            const expanded = await expandQuery(q);
            console.log(`Expanded: "${expanded}"`);
        } catch (error) {
            console.error('FULL ERROR:', error);
        }
    }
}

debugArabic();
