const fs = require('fs');
const p = 'frontend/src/services/apiBackend/adminPortalApi.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/apiClient\.post\(\/admin\/inventory\/\/adjust\/,/, (m)=>piClient.post(\/admin/inventory/\/adjust/\,);
fs.writeFileSync(p, s, 'utf8');
console.log('ok');
