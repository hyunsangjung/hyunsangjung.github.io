const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const weatherCard = document.querySelector('#weather-card');
const weatherLabels = {
  0: ['맑음', '☀️'],
  1: ['대체로 맑음', '🌤️'],
  2: ['부분적으로 흐림', '⛅'],
  3: ['흐림', '☁️'],
  45: ['안개', '🌫️'],
  48: ['서리 안개', '🌫️'],
  51: ['이슬비', '🌦️'],
  53: ['이슬비', '🌦️'],
  55: ['짙은 이슬비', '🌧️'],
  61: ['비', '🌧️'],
  63: ['비', '🌧️'],
  65: ['강한 비', '🌧️'],
  71: ['눈', '🌨️'],
  73: ['눈', '🌨️'],
  75: ['강한 눈', '❄️'],
  80: ['소나기', '🌦️'],
  81: ['소나기', '🌦️'],
  82: ['강한 소나기', '⛈️'],
  95: ['뇌우', '⛈️'],
  96: ['우박 동반 뇌우', '⛈️'],
  99: ['강한 우박 동반 뇌우', '⛈️'],
};

const loadWeather = async () => {
  if (!weatherCard) return;
  const endpoint = 'https://api.open-meteo.com/v1/forecast?latitude=37.17&longitude=127.10&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Asia%2FSeoul';
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('weather request failed');
    const data = await response.json();
    const current = data.current;
    const [label, icon] = weatherLabels[current.weather_code] || ['현재 날씨', '🌍'];
    document.querySelector('#weather-icon').textContent = icon;
    document.querySelector('#weather-status').textContent = label;
    document.querySelector('#weather-temperature').textContent = `${Math.round(current.temperature_2m)}°`;
    document.querySelector('#weather-details').textContent = `체감 ${Math.round(current.apparent_temperature)}° · 습도 ${current.relative_humidity_2m}% · 바람 ${Math.round(current.wind_speed_10m)} km/h`;
    document.querySelector('#weather-updated').textContent = `업데이트 ${current.time.replace('T', ' ')}`;
  } catch (error) {
    document.querySelector('#weather-updated').textContent = '연결 대기';
    document.querySelector('#weather-status').textContent = '날씨를 불러오지 못했습니다.';
    document.querySelector('#weather-details').textContent = '잠시 후 다시 시도해 주세요.';
  }
};

loadWeather();
