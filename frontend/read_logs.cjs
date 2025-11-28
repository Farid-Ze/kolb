const fs = require('fs');
const path = 'backend_logs.txt';

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split('\n');
    const start = 234; // 0-indexed
    const end = 300;

    for (let i = start; i < end && i < lines.length; i++) {
        console.log(lines[i]);
    }
} catch (err) {
    console.error(err);
}
