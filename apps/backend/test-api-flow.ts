import * as http from 'http';

function request(options: http.RequestOptions, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`Request failed: ${res.statusCode} ${data}`));
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testApi() {
    console.log('🔄 Testing API flow for Player 1 (using http, port 3001)...');

    try {
        // 1. Login
        console.log('1️⃣  Logging in...');
        const loginData = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'player1@test.com',
            password: 'password123'
        });

        const token = loginData.accessToken;
        console.log('✅ Login successful. Token obtained.');

        // 2. Get Seasonal Ranks
        console.log('\n2️⃣  Fetching Seasonal Ranks (/ratings/me/ranks)...');
        const ranksData = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/ratings/me/ranks',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Seasonal Ranks Response:', JSON.stringify(ranksData, null, 2));

        // 3. Get Lifetime Ratings
        console.log('\n3️⃣  Fetching Lifetime Ratings (/ratings/me/lifetime)...');
        const lifetimeData = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/ratings/me/lifetime',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Lifetime Ratings Response:', JSON.stringify(lifetimeData, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testApi();
