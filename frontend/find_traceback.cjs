const fs = require('fs');
const path = 'backend_logs.txt';

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('Traceback')) {
            console.log(`${index + 1}:${line}`);
            // Print next 20 lines
            for (let i = 1; i <= 20; i++) {
                if (lines[index + i]) {
                    console.log(`${index + 1 + i}:${lines[index + i]}`);
                }
            }
        }
    });
} catch (err) {
    console.error(err);
}
