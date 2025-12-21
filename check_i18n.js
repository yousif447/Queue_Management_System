
const fs = require('fs');
const path = require('path');

const enPath = path.join(process.cwd(), 'Frontend/src/i18n/messages/en.json');
const arPath = path.join(process.cwd(), 'Frontend/src/i18n/messages/ar.json');

function checkFile(filePath) {
  console.log(`Checking ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    // Check key resolution
    const key = 'adminDashboard.common.selectBusiness';
    const keys = key.split('.');
    let value = json;
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            console.error(`❌ Key path broken at "${k}" in ${path.basename(filePath)}`);
            value = undefined;
            break;
        }
    }
    
    if (value) {
        console.log(`✅ Found "${key}": "${value}"`);
    } else {
        console.error(`❌ Key "${key}" NOT FOUND`);
    }

    // Check for "searchBusiness"
    const searchKey = 'adminDashboard.common.searchBusiness';
    const searchKeys = searchKey.split('.');
    let searchValue = json;
    for (const k of searchKeys) {
        if (searchValue && searchValue[k]) {
            searchValue = searchValue[k];
        } else {
            searchValue = undefined;
            break;
        }
    }
     if (searchValue) {
        console.log(`✅ Found "${searchKey}": "${searchValue}"`);
    } else {
        console.error(`❌ Key "${searchKey}" NOT FOUND`);
    }

  } catch (e) {
    console.error(`❌ JSON Syntax Error in ${path.basename(filePath)}:`, e.message);
  }
}

checkFile(enPath);
checkFile(arPath);
