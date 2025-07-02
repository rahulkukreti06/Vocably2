const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const lines = env.split('\n');
let apiKey = '';
let apiSecret = '';
for (const line of lines) {
  if (line.startsWith('LIVEKIT_API_KEY=')) apiKey = line.split('=')[1].trim();
  if (line.startsWith('LIVEKIT_API_SECRET=')) apiSecret = line.split('=')[1].trim();
}
if (!apiKey || !apiSecret) {
  console.error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET not found in .env.local');
  process.exit(1);
}

const token = jwt.sign(
  {
    iss: apiKey,
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiry
  },
  apiSecret,
  { algorithm: 'HS256' }
);

console.log('Your LiveKit REST API JWT:');
console.log(token); 