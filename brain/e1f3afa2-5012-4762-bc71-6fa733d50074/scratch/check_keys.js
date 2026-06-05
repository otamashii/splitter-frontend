const fs = require('fs');
const path = require('path');

const localesPath = 'd:/cowork/splitter-frontend/src/shared/config/locales';
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));
const uz = JSON.parse(fs.readFileSync(path.join(localesPath, 'uz.json'), 'utf8'));
const ja = JSON.parse(fs.readFileSync(path.join(localesPath, 'ja.json'), 'utf8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

const enKeys = getKeys(en);
const uzKeys = getKeys(uz);
const jaKeys = getKeys(ja);

const missingInUz = enKeys.filter(k => !uzKeys.includes(k));
const missingInJa = enKeys.filter(k => !jaKeys.includes(k));

console.log('Missing in UZ:', missingInUz);
console.log('Missing in JA:', missingInJa);
