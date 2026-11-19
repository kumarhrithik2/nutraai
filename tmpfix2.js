const fs=require('fs');
const p='frontend/src/services/apiBackend/adminPortalApi.js';
let s=fs.readFileSync(p,'utf8');
// replace literal broken fragments
s = s.replace(/apiClient\.post\(\\?\\\/admin\\\/inventory\\\/\\\/adjust\\\/,\s*\{/g, "apiClient.post(/admin/inventory//adjust/, {");
s = s.replace(/apiClient\.post\(\\?\/admin\/inventory\/\/adjust\/,\s*\{/g, "apiClient.post(/admin/inventory//adjust/, {");
s = s.replace(/apiClient\.post\(\/admin\/inventory\/\/adjust\/,\s*\{/g, "apiClient.post(/admin/inventory//adjust/, {");
fs.writeFileSync(p,s);
console.log('done');
