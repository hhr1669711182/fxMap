import fs from 'fs';

const endpoint = 'https://overpass-api.de/api/interpreter';

const query = `
[out:json][timeout:60];
area["name"~"^(香洲区|Xiangzhou District)$"]["boundary"="administrative"]["admin_level"="6"]->.a;
(
  node["amenity"="fire_station"](area.a);
  way["amenity"="fire_station"](area.a);
  relation["amenity"="fire_station"](area.a);
);
out center tags;
`;

const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  body: 'data=' + encodeURIComponent(query),
});

if (!res.ok) {
  console.error('Overpass HTTP ' + res.status);
  process.exit(1);
}

const data = await res.json();
const elements = data.elements || [];

const toItem = (el) => {
  const tags = el.tags || {};
  const center = el.type === 'node' ? { lon: el.lon, lat: el.lat } : el.center;
  if (!center || !Number.isFinite(center.lon) || !Number.isFinite(center.lat)) return null;

  const name = tags.name || tags['name:zh'] || tags['name:en'] || '消防站';
  const address =
    [tags['addr:province'], tags['addr:city'], tags['addr:district'], tags['addr:subdistrict'], tags['addr:street'], tags['addr:housenumber']]
      .filter(Boolean)
      .join('');

  return {
    osmType: el.type,
    osmId: el.id,
    lng: center.lon,
    lat: center.lat,
    title: name,
    operator: tags.operator || undefined,
    address: address || tags['addr:full'] || undefined,
    phone: tags.phone || tags['contact:phone'] || undefined,
    source: 'OpenStreetMap',
  };
};

const list = elements.map(toItem).filter(Boolean);
list.sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'));
fs.writeFileSync('tmp-osm-firestations.json', JSON.stringify(list, null, 2), 'utf8');
console.log('tmp-osm-firestations.json');
