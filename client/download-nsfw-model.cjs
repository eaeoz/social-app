/**
 * NSFW Model Downloader
 * Downloads the NSFW.js model files from the official repository
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, 'public', 'models');
// Use the official model from nsfwjs repository at the correct path
const BASE_URL = 'https://raw.githubusercontent.com/infinitered/nsfwjs/master/example/nsfw_mobilenet_v2_quantized/';

const files = [
  'model.json',
  'group1-shard1of2',
  'group1-shard2of2'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('✓ Created models directory');
}

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + filename;
    const filepath = path.join(MODELS_DIR, filename);
    
    console.log(`Downloading ${filename} from ${url}...`);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }, (redirectResponse) => {
          const file = fs.createWriteStream(filepath);
          redirectResponse.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const size = fs.statSync(filepath).size;
            console.log(`✓ Downloaded ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
            resolve();
          });
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(filepath).size;
          console.log(`✓ Downloaded ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode} for ${filename}`));
      }
    }).on('error', reject);
  });
}

async function downloadAllFiles() {
  console.log('Starting NSFW model download...\n');
  
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    
    console.log('\n✓ All model files downloaded successfully!');
    console.log('\nModel files are now available in:', MODELS_DIR);
    console.log('\nYou can now run your application with NSFW detection enabled.');
  } catch (error) {
    console.error('\n✗ Error downloading files:', error.message);
    console.log('\nTrying alternative approach with NPM package...');
    console.log('\nAlternatively, you can:');
    console.log('1. Use the CDN version by updating nsfwDetector.ts');
    console.log('2. Or manually download from: https://github.com/infinitered/nsfwjs/tree/master/example/nsfw_mobilenet_v2_quantized');
    process.exit(1);
  }
}

downloadAllFiles();
