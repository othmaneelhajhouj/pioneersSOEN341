const INIT_DELAY_MS = 50;
let mapInitialized = false;

const initEventMaps = () => {
  if (mapInitialized) return;
  if (typeof window.L !== 'object') {
    window.setTimeout(initEventMaps, INIT_DELAY_MS);
    return;
  }

  mapInitialized = true;
  const L = window.L;

  document.querySelectorAll('.event-map').forEach((container) => {
    const lat = parseFloat(container.dataset.lat);
    const lng = parseFloat(container.dataset.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      container.innerHTML = '<p class="text-secondary small m-0">Unable to load map.</p>';
      return;
    }

    const map = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup(container.dataset.address || 'Event location');
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventMaps);
} else {
  initEventMaps();
}
