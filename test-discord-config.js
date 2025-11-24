// Quick test script to verify Discord OAuth configuration
require('dotenv').config();

console.log('=== Discord OAuth Configuration Check ===\n');

const config = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackUrl: process.env.DISCORD_CALLBACK_URL,
  allowedRedirects: process.env.DISCORD_ALLOWED_REDIRECTS,
};

console.log('Client ID:', config.clientId || '❌ NOT SET');
console.log('Client Secret:', config.clientSecret ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('Callback URL:', config.callbackUrl || '❌ NOT SET');
console.log('Allowed Redirects:', config.allowedRedirects || '❌ NOT SET');

console.log('\n=== Common Issues & Solutions ===\n');

if (!config.clientId || !config.clientSecret) {
  console.log('❌ Discord credentials not configured in .env file');
} else {
  console.log('✅ Discord credentials found in .env');
}

console.log('\n=== Redirect URI Checklist ===');
console.log('Make sure these are added in Discord Developer Portal:');
console.log('1. http://localhost:3001/auth/discord/callback');
console.log('2. http://localhost:3000/auth/discord/callback');
console.log('3. http://localhost:8081');
console.log('4. genki-tcg://');
console.log('\nDiscord Portal: https://discord.com/developers/applications/' + (config.clientId || 'YOUR_APP_ID') + '/oauth2');

console.log('\n=== Common 400 Errors ===');
console.log('1. redirect_uri mismatch - URI must match exactly (including trailing slash)');
console.log('2. invalid_grant - Code already used or expired (codes expire in 10 minutes)');
console.log('3. invalid_client - Wrong client_id or client_secret');
console.log('4. unauthorized_client - redirect_uri not registered in Discord portal');
