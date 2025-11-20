const fetch = global.fetch;

if (typeof fetch !== 'function') {
  throw new Error('Fetch API is not available. Use Node 18+ or add a fetch polyfill.');
}
const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

async function geocodeAddress(address) {

    if (!address?.trim()) return {status: 'skipped', message: 'Empty address'};

    const url = `${BASE_URL}/${encodeURIComponent(address)}.json?${new URLSearchParams({access_token: process.env.MAPBOX_ACCESS_TOKEN, limit: '1',})}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Mapbox error ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const feature = json.features?.[0];

    if (!feature?.geometry?.coordinates) {
    return {status: 'failed', message: 'No coordinates returned'};
    }

    return {
        status: 'ok',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        formattedAddress: feature.place_name,
        precision: Math.round((feature.relevance ?? 0)*100),
    };
}

module.exports = {geocodeAddress};
