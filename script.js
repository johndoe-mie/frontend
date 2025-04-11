const apiKey = "0e54a07e203e4caa9364e27ceb70fc67";

async function getWeather() {
  const city = document.getElementById("city-input").value;
  if (!city) return alert("Please enter a city name");

  const currentUrl = `https://api.weatherbit.io/v2.0/current?city=${city}&key=${apiKey}`;
  const forecastUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&days=7&key=${apiKey}`;
  const hourlyUrl = `https://api.weatherbit.io/v2.0/forecast/hourly?city=${city}&hours=6&key=${apiKey}`;

  try {
    const [currentRes, forecastRes, hourlyRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
      fetch(hourlyUrl),
    ]);

    const currentData = (await currentRes.json()).data[0];
    const forecastData = (await forecastRes.json()).data;
    const hourlyData = (await hourlyRes.json()).data;

    displayCurrent(currentData, city);
    displayForecast(forecastData);
    displayHourly(hourlyData);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch weather data. Check city name or API key.");
  }
}

function displayCurrent(data, city) {
  document.getElementById("current-weather").innerHTML = `
    <div class="location-time">
      <h2>${city.toUpperCase()}</h2>
      <p>${new Date(data.ob_time).toUTCString()}</p>
    </div>
    <div class="temperature-icon">
      <h1>${data.temp}°C</h1>
      <img src="https://www.weatherbit.io/static/img/icons/${data.weather.icon}.png" alt="weather icon">
      <p>${data.weather.description}</p>
    </div>
  `;
  document.getElementById("air-conditions").innerHTML = `
    <div class="condition"><span>🌡</span> Real Feel: ${data.app_temp}°C</div>
    <div class="condition"><span>💨</span> Wind: ${data.wind_spd.toFixed(2)} m/s</div>
    <div class="condition"><span>☁️</span> Clouds: ${data.clouds}%</div>
    <div class="condition"><span>💧</span> Humidity: ${data.rh}%</div>
  `;
}

function displayForecast(data) {
  const forecastContainer = document.getElementById("weekly-forecast");
  forecastContainer.innerHTML = "";
  data.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${new Date(day.datetime).toLocaleDateString(undefined, { weekday: 'long' })}</h4>
      <img src="https://www.weatherbit.io/static/img/icons/${day.weather.icon}.png" alt="icon">
      <p>${day.weather.description}</p>
      <p>🌡 ${day.temp}°C</p>
      <p>💧 ${day.rh}%</p>
      <p>💨 ${day.wind_spd.toFixed(2)} m/s</p>
    `;
    forecastContainer.appendChild(card);
  });
}

function displayHourly(data) {
  const hourlyContainer = document.getElementById("hourly-forecast");
  hourlyContainer.innerHTML = "";
  data.forEach(hour => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${hour.timestamp_local.slice(11, 16)}</h4>
      <img src="https://www.weatherbit.io/static/img/icons/${hour.weather.icon}.png" alt="icon">
      <p>${hour.weather.description}</p>
      <p>🌡 ${hour.temp}°C</p>
    `;
    hourlyContainer.appendChild(card);
  });
}



// 🧠 ML Rainfall Prediction & Comparison (from Flask)
async function getRainfallPrediction() {
  const pastYear = prompt("Enter a past year (e.g. 2015) for rainfall comparison:");
  if (!pastYear || isNaN(pastYear)) return alert("Invalid year entered");

  try {
    const response = await fetch(`https://ml-weather-api.onrender.com/predict?year=${pastYear}`);
    const data = await response.json();

    if (data.error) return alert(data.error);

    const labels = Object.keys(data.predicted_2025);
    const predicted = Object.values(data.predicted_2025);
    const past = Object.values(data.past_data).slice(0, 12);  // Ignore 'Total'

    renderRainfallChart(labels, predicted, past, pastYear);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch rainfall prediction.");
  }
}

let rainfallChart;
let currentChartType = 'bar';

const months = [
  "Jan", "Feb", "Mar", "April", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
];

document.addEventListener("DOMContentLoaded", () => {
  // Load dropdown
  const yearSelect = document.getElementById("year-select");
  for (let y = 2000; y <= 2023; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.text = y;
    yearSelect.appendChild(opt);
  }

  // Show only 2025 prediction on load
  fetchDefaultPrediction();

  // Listen for chart type change
  document.getElementById("chart-type").addEventListener("change", (e) => {
    currentChartType = e.target.value;
    // Refresh current chart
    fetchRainfallPrediction();
  });
});

async function fetchDefaultPrediction() {
   // Replace localhost with your live backend
const res = await fetch(`https://ml-weather-api.onrender.com/predict?year=2010`);
// any year will work to fetch the prediction part
  const data = await res.json();

  const predicted = months.map(m => data.predicted_2025[m]);

  renderChart(months, [
    {
      label: `Predicted 2025`,
      data: predicted,
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.4,
      fill: currentChartType === 'line'
    }
  ]);
}

async function fetchRainfallPrediction() {
  const year = document.getElementById("year-select").value;
  const res = await fetch(`https://ml-weather-api.onrender.com/predict?year=${year}`);
  const data = await res.json();

  const predicted = months.map(m => data.predicted_2025[m]);
  const past = months.map(m => data.past_data[m]);

  renderChart(months, [
    {
      label: `Predicted 2025`,
      data: predicted,
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.4,
      fill: currentChartType === 'line'
    },
    {
      label: `Actual ${data.past_year}`,
      data: past,
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      tension: 0.4,
      fill: currentChartType === 'line'
    }
  ]);
}

function renderChart(labels, datasets) {
  const ctx = document.getElementById("rainfall-chart").getContext("2d");

  if (rainfallChart) rainfallChart.destroy();

  rainfallChart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Rainfall (mm)'
          }
        }
      }
    }
  });
}

