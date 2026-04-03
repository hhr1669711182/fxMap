import fs from 'fs';

const inputPath = 'tmp-osm-firestations.json';
const list = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const endpoint = 'https://nominatim.openstreetmap.org/reverse';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const enrichOne = async (item) => {
  const url =
    endpoint +
    `?format=jsonv2&lat=${encodeURIComponent(item.lat)}&lon=${encodeURIComponent(
      item.lng
    )}&zoom=18&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.6',
      'user-agent': 'OpenlayersMap/1.0 (local script)',
    },
  });
  if (!res.ok) return { ...item };
  const data = await res.json();
  const addr = data.address || {};
  return {
    ...item,
    displayName: data.display_name || undefined,
    address: {
      country: addr.country,
      state: addr.state,
      city: addr.city || addr.town,
      district: addr.city_district || addr.district,
      suburb: addr.suburb,
      road: addr.road,
      houseNumber: addr.house_number,
      postcode: addr.postcode,
    },
  };
};

const out = [];
for (let i = 0; i < list.length; i++) {
  const item = list[i];
  out.push(await enrichOne(item));
  await sleep(900);
}

fs.writeFileSync('tmp-osm-firestations-enriched.json', JSON.stringify(out, null, 2), 'utf8');
console.log('tmp-osm-firestations-enriched.json');
