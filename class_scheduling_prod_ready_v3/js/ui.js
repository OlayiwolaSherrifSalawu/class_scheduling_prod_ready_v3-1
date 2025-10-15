// UI helpers
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

export function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function initTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
}

export function toast(msg, type='ok', timeout=3500){
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.remove(); }, timeout);
}

export function routePush(hash){
  location.hash = hash.startsWith('#')? hash : '#'+hash;
}

export function todayKey(){
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

export function section(title, inner){
  const s = document.createElement('section');
  s.className = 'card';
  s.innerHTML = `<h2>${title}</h2>${inner}`;
  return s;
}

export function mapView() {
  const container = document.createElement('div');
  container.className = 'card';
  container.innerHTML = `
    <h2>Venue Map</h2>
    <p>Find the location of your lecture venues on campus.</p>
    <div id="map" style="height: 500px; width: 100%;"></div>
  `;

  // We need to wait a moment for the container to be added to the DOM
  // before initializing the map.
  setTimeout(() => {
    // Check if the map container is in the document
    if (!document.getElementById('map')) return;

    const map = L.map('map').setView([7.85944, 6.68361], 15);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    const venues = [
      { name: 'FSLT 1', lat: 7.860, lon: 6.684, description: 'Faculty of Science Lecture Theatre 1' },
      { name: 'Lecture Hall A', lat: 7.858, lon: 6.682, description: 'Main Lecture Hall A' },
      { name: 'University Library', lat: 7.859, lon: 6.685, description: 'University Main Library' },
      { name: 'Admin Block', lat: 7.861, lon: 6.683, description: 'Administrative Building' }
    ];

    venues.forEach(venue => {
      const marker = L.marker([venue.lat, venue.lon]).addTo(map);
      marker.bindPopup(`<b>${venue.name}</b><br>${venue.description}`);
    });
  }, 100);

  return container;
}
