const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'production';
const isProduction = mode === 'production';
const apiUrl = process.env.FRONTEND_PUBLIC_API_URL || process.env.API_URL || (isProduction
  ? 'https://your-railway-backend.up.railway.app/api/v1'
  : 'http://localhost:3000/api/v1');

const target = path.resolve(__dirname, '../src/environments/environment.prod.ts');
const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  appName: 'Pustakwala',
};
`;

fs.writeFileSync(target, content, 'utf8');
console.log(`Wrote ${target} with apiUrl=${apiUrl}`);
