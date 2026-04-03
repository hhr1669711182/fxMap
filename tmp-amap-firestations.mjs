import fs from 'fs';
import path from 'path';

const mapVue = path.join(process.cwd(), 'src', 'baseComponent', 'OpenlayersMap', 'map.vue');
const txt = fs.readFileSync(mapVue, 'utf8');
const m = txt.match(/amapKey\s*=\s*ref<[^>]*>\(\"([^\"]+)\"\)/);
if (!m) {
  console.error('AMAP key not found in map.vue');
  process.exit(1);
}

const key = m[1];

const keywordsList = ['消防救援站', '消防救援大队', '消防救援中队', '消防站'];
const city = '珠海';
const pages = 3;
const offset = 25;

const seen = new Set();
const out = [];

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};

for (const kw of keywordsList) {
  for (let page = 1; page <= pages; page++) {
    const url =
      'https://restapi.amap.com/v3/place/text?key=' +
      encodeURIComponent(key) +
      '&keywords=' +
      encodeURIComponent(kw) +
      '&city=' +
      encodeURIComponent(city) +
      '&citylimit=true&offset=' +
      offset +
      '&page=' +
      page +
      '&extensions=base&output=JSON';

    const data = await fetchJson(url);
    if (data?.status === '0') {
      console.error(data?.info || 'AMap request failed');
      process.exit(1);
    }

    const pois = data?.pois || [];
    if (!pois.length) break;

    for (const p of pois) {
      const loc = String(p.location || '').trim();
      if (!loc.includes(',')) continue;
      const [lngStr, latStr] = loc.split(',');
      const lng = Number(lngStr);
      const lat = Number(latStr);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;

      const text = `${p.adname || ''}${p.address || ''}${p.name || ''}`;
      if (!text.includes('香洲')) continue;

      const id = p.id || `${p.name}_${lng}_${lat}`;
      if (seen.has(id)) continue;
      seen.add(id);

      out.push({
        id: p.id || undefined,
        lng,
        lat,
        title: p.name,
        address: p.address || undefined,
        tel: p.tel || undefined,
        type: p.type || undefined,
        typecode: p.typecode || undefined,
        adcode: p.adcode || undefined,
        district: p.adname || undefined,
        city: p.cityname || undefined,
        province: p.pname || undefined,
      });
    }
  }
}

out.sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'));
console.log(JSON.stringify(out, null, 2));
