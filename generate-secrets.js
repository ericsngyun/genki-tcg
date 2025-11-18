#!/usr/bin/env node

const crypto = require('crypto');

console.log('');
console.log('='.repeat(60));
console.log('  Genki TCG - Environment Secrets Generator');
console.log('='.repeat(60));
console.log('');
console.log('Copy these values to your .env file:');
console.log('');
console.log('-'.repeat(60));
console.log('');

const jwtSecret = crypto.randomBytes(64).toString('base64');
const refreshSecret = crypto.randomBytes(64).toString('base64');

console.log(`JWT_SECRET="${jwtSecret}"`);
console.log('');
console.log(`REFRESH_TOKEN_SECRET="${refreshSecret}"`);
console.log('');
console.log('-'.repeat(60));
console.log('');
console.log('Full .env configuration example:');
console.log('');
console.log('DATABASE_URL="postgresql://postgres:your_password@localhost:5432/genki_tcg"');
console.log('');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log('JWT_EXPIRES_IN="15m"');
console.log('');
console.log(`REFRESH_TOKEN_SECRET="${refreshSecret}"`);
console.log('REFRESH_TOKEN_EXPIRES_IN="7d"');
console.log('');
console.log('API_PORT=3001');
console.log('CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"');
console.log('NODE_ENV="development"');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('✅ Save this to your .env file in the root directory');
console.log('');
