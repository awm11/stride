// Copies the web app into www/ for the Android build: same index.html, with the build number set,
// Leaflet bundled (so maps' code works offline) and Capacitor's bridge script added.
const fs = require('fs'), path = require('path');
const build = parseInt(process.argv[2], 10);
if (!(build > 0)) throw new Error('usage: node prepare-www.js <build number>');
const root = path.join(__dirname, '..'), www = path.join(__dirname, 'www');
fs.rmSync(www, { recursive:true, force:true });
fs.mkdirSync(path.join(www, 'vendor', 'leaflet'), { recursive:true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('prepare-www: expected to find ' + from); html = html.replace(from, to); };
swap('const NATIVE_BUILD = 0;', `const NATIVE_BUILD = ${build};`);
html = html.replace(/<link rel="stylesheet" href="https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.css"[^>]*>/, '<link rel="stylesheet" href="vendor/leaflet/leaflet.css">');
html = html.replace(/<script src="https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.js"[^>]*><\/script>/, '<script src="vendor/leaflet/leaflet.js" defer></script>');
if (html.includes('unpkg.com/leaflet')) throw new Error('prepare-www: Leaflet tags not rewritten');
swap('<meta charset="utf-8">', '<meta charset="utf-8">\n<script src="capacitor.js"></script>');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
fs.writeFileSync(path.join(www, 'index.html'), html);

const copyDir = (a, b) => { fs.mkdirSync(b, { recursive:true }); for (const f of fs.readdirSync(a)){ const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };
copyDir(path.join(root, 'icons'), path.join(www, 'icons'));
const nm = path.join(__dirname, 'node_modules');
for (const f of ['leaflet.js', 'leaflet.css']) fs.copyFileSync(path.join(nm, 'leaflet', 'dist', f), path.join(www, 'vendor', 'leaflet', f));
copyDir(path.join(nm, 'leaflet', 'dist', 'images'), path.join(www, 'vendor', 'leaflet', 'images'));
fs.copyFileSync(path.join(nm, '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(www, 'capacitor.js'));
console.log(`www ready for build ${build}`);
