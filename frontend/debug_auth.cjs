const https = require('http');

const email = `test_node_${Math.floor(Math.random() * 10000)}@example.com`;
const data = JSON.stringify({
    email: email,
    password: "password123",
    full_name: "Node User"
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log(`Response: ${body}`);
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error}`);
});

req.write(data);
req.end();
