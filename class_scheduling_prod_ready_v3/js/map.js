// Initialize the map and set its view to the Federal University Lokoja campus
const map = L.map('map').setView([7.85944, 6.68361], 15);

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Placeholder venue data with approximate coordinates
const venues = [
  { name: 'FSLT 1', lat: 7.860, lon: 6.684, description: 'Faculty of Science Lecture Theatre 1' },
  { name: 'Lecture Hall A', lat: 7.858, lon: 6.682, description: 'Main Lecture Hall A' },
  { name: 'University Library', lat: 7.859, lon: 6.685, description: 'University Main Library' },
  { name: 'Admin Block', lat: 7.861, lon: 6.683, description: 'Administrative Building' }
];

// Add markers for each venue
venues.forEach(venue => {
  const marker = L.marker([venue.lat, venue.lon]).addTo(map);
  marker.bindPopup(`<b>${venue.name}</b><br>${venue.description}`);
});