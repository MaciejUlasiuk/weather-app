const API_KEY = '';

const form = document.getElementById('weatherForm');
const weatherInfo = document.getElementById('weatherInfo');
const description = document.getElementById('weatherDescription');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const cityName = document.getElementById('cityName');
const wind = document.getElementById('wind');
const forecastContainer = document.getElementById('forecast');
const historyList = document.getElementById('historyList');
const favoritesList = document.getElementById('favoritesList');
const chartCanvas = document.getElementById('weatherChart').getContext('2d');
const languageSelector = document.getElementById('language');
const loader = document.getElementById('loader');
const toggleThemeBtn = document.getElementById('toggleTheme');
const addFavoriteBtn = document.getElementById('addFavorite');
const resetBtn = document.getElementById('reset');

let chart;
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentCity = null;
let currentLang = localStorage.getItem('lang') || 'pl';
let darkMode = localStorage.getItem('darkMode') === 'true';

languageSelector.value = currentLang;
if(darkMode) {
  document.body.classList.add('dark');
  toggleThemeBtn.textContent = '☀️';
} else {
  toggleThemeBtn.textContent = '🌙';
}

languageSelector.addEventListener('change', () => {
  currentLang = languageSelector.value;
  localStorage.setItem('lang', currentLang);
  if(currentCity) {
    getWeather(currentCity);
  }
});

toggleThemeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  document.body.classList.toggle('dark', darkMode);
  toggleThemeBtn.textContent = darkMode ? '☀️' : '🌙';
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const city = document.getElementById('city').value.trim();
  if(city) getWeather(city);
});

resetBtn.addEventListener('click', () => {
  resetForm();
});

addFavoriteBtn.addEventListener('click', () => {
  if(currentCity && !favorites.includes(currentCity)) {
    favorites.push(currentCity);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
  }
});

function getWeather(city) {
  showLoader(true);
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=${currentLang}`)
    .then(res => {
      if (!res.ok) throw new Error('Błąd sieci lub brak danych.');
      return res.json();
    })
    .then(data => {
      currentCity = data.name;
      showLoader(false);

      updateCurrentWeather(data);
      updateChart(data);
      updateSearchHistory(currentCity);
      renderFavorites();
      fetchForecast(currentCity);

      form.classList.add('hidden');
      weatherInfo.classList.remove('hidden');
    })
    .catch(() => {
      showLoader(false);
      alert(currentLang === 'pl' ? 'Nie udało się pobrać danych pogodowych.' : 'Failed to fetch weather data.');
    });
}

function updateCurrentWeather(data) {
  cityName.textContent = currentLang === 'pl' ? `Pogoda w mieście: ${data.name}` : `Weather in: ${data.name}`;
  description.textContent = `${data.weather[0].description}`;
  temperature.textContent = `${currentLang === 'pl' ? 'Temperatura' : 'Temperature'}: ${data.main.temp}°C`;
  humidity.textContent = `${currentLang === 'pl' ? 'Wilgotność' : 'Humidity'}: ${data.main.humidity}%`;
  wind.textContent = `${currentLang === 'pl' ? 'Wiatr' : 'Wind'}: ${data.wind.speed} m/s`;
}

function updateChart(data) {
  const labels = currentLang === 'pl' ? ['Temperatura', 'Wilgotność', 'Wiatr'] : ['Temperature', 'Humidity', 'Wind'];
  const values = [data.main.temp, data.main.humidity, data.wind.speed];

  if(chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: currentLang === 'pl' ? 'Dane pogodowe' : 'Weather data',
        data: values,
        backgroundColor: ['#2196f3', '#4caf50', '#ff9800']
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateSearchHistory(city) {
  if(!searchHistory.includes(city)) {
    searchHistory.push(city);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    renderHistory();
  }
}

function renderHistory() {
  historyList.innerHTML = '';
  searchHistory.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => getWeather(city));
    historyList.appendChild(li);
  });
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => getWeather(city));
    favoritesList.appendChild(li);
  });
}

function fetchForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=${currentLang}`)
    .then(res => {
      if(!res.ok) throw new Error('Błąd prognozy');
      return res.json();
    })
    .then(data => {
      renderForecast(data);
    })
    .catch(() => {
      forecastContainer.innerHTML = currentLang === 'pl' ? 'Nie udało się pobrać prognozy.' : 'Failed to fetch forecast.';
    });
}

function renderForecast(data) {
  // Ograniczamy do prognozy na 5 dni - raz dziennie (np. 12:00)
  forecastContainer.innerHTML = '';
  const daily = {};
  data.list.forEach(item => {
    const date = new Date(item.dt_txt);
    const hour = date.getHours();
    if(hour === 12) {
      const dayKey = date.toISOString().slice(0,10);
      daily[dayKey] = item;
    }
  });

  Object.values(daily).slice(0,5).forEach(item => {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString(currentLang, { weekday: 'short', day: 'numeric', month: 'numeric' });

    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <p><strong>${dayName}</strong></p>
      <p>${item.weather[0].description}</p>
      <p>${Math.round(item.main.temp)}°C</p>
    `;
    forecastContainer.appendChild(div);
  });
}

function resetForm() {
  form.reset();
  form.classList.remove('hidden');
  weatherInfo.classList.add('hidden');
  forecastContainer.innerHTML = '';
  currentCity = null;
}

function showLoader(show) {
  loader.classList.toggle('hidden', !show);
}

renderHistory();
renderFavorites();

