import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OPENAPI_URL = 'http://localhost:8000/openapi.json';
const OUTPUT_FILE = path.resolve('./openapi.json');

async function fetchSchema() {
    console.log(`Fetching schema from ${OPENAPI_URL}...`);
    try {
        const response = await fetch(OPENAPI_URL);
        if (!response.ok) throw new Error(`Failed to fetch schema: ${response.statusText}`);
        const data = await response.json();
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
        console.log(`Schema saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error fetching schema:', error);
        console.error('Make sure the backend is running on port 8000.');
        process.exit(1);
    }
}

async function generate() {
    await fetchSchema();
    console.log('Running code generation...');
    try {
        execSync('npm run generate-client', { stdio: 'inherit' });
        console.log('Code generation complete.');
    } catch (error) {
        console.error('Code generation failed:', error);
        process.exit(1);
    }
}

generate();
