const API_BASE = 'https://api.openweathermap.org/data/2.5';

// ── Selektori ──
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const btnC = document.getElementById('btn-c');
const btnF = document.getElementById('btn-f');

let currentUnit = 'metric';
let lastCity = '';

// ── Event Listeners ──
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) fetchWeather(city);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  }
});

geoBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherByCoords(latitude, longitude);
  });
});

btnC.addEventListener('click', () => switchUnit('metric'));
btnF.addEventListener('click', () => switchUnit('imperial'));

// ── Fetch by city name ──
async function fetchWeather(city) {
  lastCity = city;
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${API_BASE}/weather?q=${city}&units=${currentUnit}&appid=${API_KEY}`),
      fetch(`${API_BASE}/forecast?q=${city}&units=${currentUnit}&cnt=40&appid=${API_KEY}`)
    ]);

    if (!currentRes.ok) throw new Error('Grad nije pronađen');

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    renderCurrent(current);
    renderForecast(forecast);
  } catch (err) {
    alert(err.message);
  }
}

// ── Fetch by coordinates ──
async function fetchWeatherByCoords(lat, lon) {
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`),
      fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&cnt=40&appid=${API_KEY}`)
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    lastCity = current.name;

    renderCurrent(current);
    renderForecast(forecast);
  } catch (err) {
    alert('Greška pri dohvatanju lokacije');
  }
}

// ── Render current weather ──
function renderCurrent(data) {
  const unit = currentUnit === 'metric' ? '°C' : '°F';

  document.getElementById('city-name').textContent = data.name;
  document.getElementById('country-date').textContent =
    `${data.sys.country} · ${formatDate(data.dt)}`;
  document.getElementById('temp-main').textContent =
    `${Math.round(data.main.temp)}${unit}`;
  document.getElementById('condition-label').textContent =
    data.weather[0].description;
  document.getElementById('feels-like').textContent =
    `Feels like ${Math.round(data.main.feels_like)}${unit}`;
  document.getElementById('weather-icon').src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('wind').textContent = `${Math.round(data.wind.speed)} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
  document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;

  document.getElementById('current-weather').style.display = 'block';
  document.querySelector('.stats-grid').style.display = 'grid';
  document.querySelector('.forecast-section').style.display = 'block';
}

// ── Render forecast ──
function renderForecast(data) {
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';

  // Uzmi jedan forecast po danu (podne)
  const daily = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

  daily.forEach(day => {
    const unit = currentUnit === 'metric' ? '°C' : '°F';
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <p class="fc-day">${getDay(day.dt)}</p>
      <img class="fc-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" />
      <p class="fc-temp-high">${Math.round(day.main.temp_max)}${unit}</p>
      <p class="fc-temp-low">${Math.round(day.main.temp_min)}${unit}</p>
      <p class="fc-desc">${day.weather[0].description}</p>
    `;
    grid.appendChild(card);
  });
}

// ── Unit switch ──
function switchUnit(unit) {
  currentUnit = unit;
  btnC.classList.toggle('active', unit === 'metric');
  btnF.classList.toggle('active', unit === 'imperial');

  if (lastCity) fetchWeather(lastCity);
}

// ── Helpers ──
function formatDate(dt) {
  return new Date(dt * 1000).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function getDay(dt) {
  return new Date(dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}