// Usage: node extract_coast.mjs "<Country name>" [minLon minLat maxLon maxLat] > coast.json
// Needs: npm i world-atlas topojson-client   (run in the working folder)
// Several countries: separate names with "|", e.g. "Spain|Portugal".
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/');
const topo = require('world-atlas/countries-10m.json');
const { feature } = require('topojson-client');
const names = (process.argv[2] || '').split('|').map(s => s.trim().toLowerCase());
const [minLon, minLat, maxLon, maxLat] = process.argv.slice(3).map(Number);
const hasBox = !Number.isNaN(maxLat);
const fc = feature(topo, topo.objects.countries);
const out = [];
for (const f of fc.features) {
  if (!names.includes(String(f.properties.name).toLowerCase())) continue;
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const p of polys) {
    const ring = p[0];
    const lons = ring.map(c => c[0]), lats = ring.map(c => c[1]);
    const b = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
    if (hasBox && (b[2] < minLon || b[0] > maxLon || b[3] < minLat || b[1] > maxLat)) continue;
    if ((b[2] - b[0]) * (b[3] - b[1]) < 0.0004) continue; // drop tiny islets
    const r = ring.map(c => [+c[0].toFixed(3), +c[1].toFixed(3)]).filter((c, i, a) => i === 0 || c[0] !== a[i-1][0] || c[1] !== a[i-1][1]);
    out.push(r);
  }
}
if (!out.length) { console.error('No polygons found. Check the country name (Natural Earth naming, e.g. "United States of America").'); process.exit(1); }
process.stdout.write(JSON.stringify(out));
console.error(`${out.length} polygons, ${out.reduce((a, r) => a + r.length, 0)} points`);
