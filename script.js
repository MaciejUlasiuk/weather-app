const API_KEY = '';

const authContainer = document.getElementById('authContainer');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const mainContainer = document.querySelector('.container');
const logoutBtn = document.getElementById('logoutBtn');
const currentUsernameSpan = document.getElementById('currentUsername');

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

const translations = {
    mainTitle: { pl: 'Aplikacja Pogodowa', en: 'Weather App' },
    langAria: { pl: 'Wybór języka', en: 'Language selection' },
    themeAria: { pl: 'Przełącz tryb jasny/ciemny', en: 'Toggle light/dark mode' },
    formAria: { pl: 'Formularz wyszukiwania miasta', en: 'City search form' },
    cityPlaceholder: { pl: 'Wpisz miasto', en: 'Enter a city' },
    submitButton: { pl: 'Pobierz pogodę', en: 'Get Weather' },
    loaderText: { pl: 'Ładowanie...', en: 'Loading...' },
    addFavoriteBtn: { pl: 'Dodaj do ulubionych', en: 'Add to favorites' },
    addFavoriteAria: { pl: 'Dodaj do ulubionych', en: 'Add to favorites' },
    chartAria: { pl: 'Wykres danych pogodowych', en: 'Weather data chart' },
    resetButton: { pl: 'Wróć', en: 'Go Back' },
    resetAria: { pl: 'Wróć do wyszukiwania', en: 'Go back to search' },
    historyTitle: { pl: 'Historia wyszukiwań', en: 'Search History' },
    historyAria: { pl: 'Lista historii wyszukiwań', en: 'Search history list' },
    favoritesTitle: { pl: 'Ulubione miasta', en: 'Favorite Cities' },
    favoritesAria: { pl: 'Lista ulubionych miast', en: 'Favorite cities list' },
    fetchError: { pl: 'Nie udało się pobrać danych pogodowych.', en: 'Failed to fetch weather data.' },
    forecastError: { pl: 'Nie udało się pobrać prognozy.', en: 'Failed to fetch forecast.' },
    weatherIn: { pl: 'Pogoda w mieście', en: 'Weather in' },
    temperatureLabel: { pl: 'Temperatura', en: 'Temperature' },
    humidityLabel: { pl: 'Wilgotność', en: 'Humidity' },
    windLabel: { pl: 'Wiatr', en: 'Wind' },
    chartLabel: { pl: 'Dane pogodowe', en: 'Weather data' },
    logoutBtn: { pl: 'Wyloguj', en: 'Logout'},
    welcome: { pl: 'Witaj', en: 'Welcome' }
};

let chart;
let users = JSON.parse(localStorage.getItem('weatherAppUsers')) || [];
let currentUser = localStorage.getItem('weatherAppCurrentUser');
let searchHistory = [];
let favorites = [];
let currentCity = null;
let currentLang = localStorage.getItem('lang') || 'pl';
let darkMode = localStorage.getItem('darkMode') === 'true';

function saveUsers() {
    localStorage.setItem('weatherAppUsers', JSON.stringify(users));
}

function saveCurrentUser() {
    if (!currentUser) return;
    const user = users.find(u => u.username === currentUser);
    if (user) {
        user.history = searchHistory;
        user.favorites = favorites;
        saveUsers();
    }
}

function setLanguage(lang) {
    document.querySelector('header h1').textContent = translations.mainTitle[lang];
    document.documentElement.lang = lang;
    languageSelector.setAttribute('aria-label', translations.langAria[lang]);
    toggleThemeBtn.setAttribute('aria-label', translations.themeAria[lang]);
    form.setAttribute('aria-label', translations.formAria[lang]);
    document.getElementById('city').placeholder = translations.cityPlaceholder[lang];
    form.querySelector('button[type="submit"]').textContent = translations.submitButton[lang];
    loader.innerHTML = `<div class="spinner"></div> ${translations.loaderText[lang]}`;
    addFavoriteBtn.textContent = translations.addFavoriteBtn[lang];
    addFavoriteBtn.setAttribute('aria-label', translations.addFavoriteAria[lang]);
    document.getElementById('weatherChart').setAttribute('aria-label', translations.chartAria[lang]);
    resetBtn.textContent = translations.resetButton[lang];
    resetBtn.setAttribute('aria-label', translations.resetAria[lang]);
    document.querySelector('.history-favorites > div:nth-child(1) h3').textContent = translations.historyTitle[lang];
    historyList.setAttribute('aria-label', translations.historyAria[lang]);
    document.querySelector('.history-favorites > div:nth-child(2) h3').textContent = translations.favoritesTitle[lang];
    favoritesList.setAttribute('aria-label', translations.favoritesAria[lang]);
    logoutBtn.textContent = translations.logoutBtn[lang];
    currentUsernameSpan.previousSibling.textContent = `${translations.welcome[lang]}, `;

}

function initializeApp() {
    if (currentUser) {
        const user = users.find(u => u.username === currentUser);
        if (user) {
            searchHistory = user.history || [];
            favorites = user.favorites || [];
            currentUsernameSpan.textContent = currentUser;
        }
        authContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        renderHistory();
        renderFavorites();
    } else {
        authContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    }
    languageSelector.value = currentLang;
    if (darkMode) {
        document.body.classList.add('dark');
        toggleThemeBtn.textContent = '☀️';
    } else {
        toggleThemeBtn.textContent = '🌙';
    }
    setLanguage(currentLang);
}

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    if (users.find(user => user.username === username)) {
        alert('Nazwa użytkownika jest już zajęta.');
        return;
    }
    users.push({ username, password, history: [], favorites: [] });
    saveUsers();
    alert('Rejestracja pomyślna. Możesz się teraz zalogować.');
    showLoginLink.click();
    registerForm.reset();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = username;
        localStorage.setItem('weatherAppCurrentUser', currentUser);
        initializeApp();
    } else {
        alert('Nieprawidłowa nazwa użytkownika lub hasło.');
    }
});

logoutBtn.addEventListener('click', () => {
    saveCurrentUser();
    currentUser = null;
    localStorage.removeItem('weatherAppCurrentUser');
    searchHistory = [];
    favorites = [];
    location.reload();
});

languageSelector.addEventListener('change', () => {
    currentLang = languageSelector.value;
    localStorage.setItem('lang', currentLang);
    setLanguage(currentLang);
    if (currentCity) {
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
    if (city) getWeather(city);
});

resetBtn.addEventListener('click', () => {
    resetForm();
});

addFavoriteBtn.addEventListener('click', () => {
    if (currentCity && !favorites.includes(currentCity)) {
        favorites.push(currentCity);
        renderFavorites();
        saveCurrentUser();
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
            fetchForecast(currentCity);
            form.classList.add('hidden');
            weatherInfo.classList.remove('hidden');
        })
        .catch(() => {
            showLoader(false);
            alert(translations.fetchError[currentLang]);
        });
}

function updateCurrentWeather(data) {
    cityName.textContent = `${translations.weatherIn[currentLang]}: ${data.name}`;
    description.textContent = `${data.weather[0].description}`;
    temperature.textContent = `${translations.temperatureLabel[currentLang]}: ${data.main.temp}°C`;
    humidity.textContent = `${translations.humidityLabel[currentLang]}: ${data.main.humidity}%`;
    wind.textContent = `${translations.windLabel[currentLang]}: ${data.wind.speed} m/s`;
}

function updateChart(data) {
    const labels = [translations.temperatureLabel[currentLang], translations.humidityLabel[currentLang], translations.windLabel[currentLang]];
    const values = [data.main.temp, data.main.humidity, data.wind.speed];
    if (chart) chart.destroy();
    chart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: translations.chartLabel[currentLang],
                data: values,
                backgroundColor: ['#2196f3', '#4caf50', '#ff9800']
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateSearchHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 10) searchHistory.pop();
        renderHistory();
        saveCurrentUser();
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
            if (!res.ok) throw new Error('Błąd prognozy');
            return res.json();
        })
        .then(data => {
            renderForecast(data);
        })
        .catch(() => {
            forecastContainer.innerHTML = translations.forecastError[currentLang];
        });
}

function renderForecast(data) {
    forecastContainer.innerHTML = '';
    const daily = {};
    data.list.forEach(item => {
        const date = new Date(item.dt_txt);
        const hour = date.getHours();
        if (hour === 12) {
            const dayKey = date.toISOString().slice(0, 10);
            daily[dayKey] = item;
        }
    });

    Object.values(daily).slice(0, 5).forEach(item => {
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

initializeApp();