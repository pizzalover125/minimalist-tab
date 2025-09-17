const quickLinks = [
  { title: "Documentation", url: "https://github.com" }, // TODO: Change URLs
  { title: "Source Code", url: "https://github.com" }, // TODO: Change URLs
  { title: "YouTube", url: "https://youtube.com" },
  { title: "Amazon", url: "https://amazon.com" },
  { title: "Apple", url: "https://apple.com" },
];

const use24Hour = true;
const showTime = true;
const showDate = true;
const showWeather = true;
let useCelsius = true;
let weatherUpdateInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  renderQuickLinks();
  updateTime();
  updateWeather();
  startWeatherUpdates();

  document.getElementById("searchBox").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      e.target.value = "";

      if (!query) return;
      const isUrl = query.includes(".") && !query.includes(" ");
      if (isUrl) {
        const finalUrl = query.startsWith("http") ? query : "https://" + query;
        window.location.href = finalUrl;
      } else {
        window.location.href =
          "https://www.google.com/search?q=" + encodeURIComponent(query);
      }
    }
  });

  setInterval(updateTime, 1000);
});

function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24Hour,
  });
  const dateStr = now.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (showTime) document.getElementById("time").textContent = timeStr;
  if (showDate) document.getElementById("date").textContent = dateStr;
}

function startWeatherUpdates() {
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  weatherUpdateInterval = setInterval(updateWeather, 60000);
}

function updateWeather() {
  const weatherEl = document.getElementById("weather");
  weatherEl.style.display = "block";
  weatherEl.textContent = "Loading weather...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const tempUnit = useCelsius ? "celsius" : "fahrenheit";
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${tempUnit}&timezone=auto`;

      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.current_weather) {
            const current = data.current_weather;
            const t = Math.round(current.temperature);
            const unit = useCelsius ? "°C" : "°F";
            const weatherDescription = getWeatherDescription(
              current.weathercode
            );
            const windSpeed = Math.round(current.windspeed);

            weatherEl.innerHTML = `<div>${t}${unit} / ${weatherDescription} / ${windSpeed} km/h</div>`;
          } else {
            weatherEl.textContent = "Weather unavailable";
          }
        })
        .catch(() => (weatherEl.textContent = "Weather error"));
    },
    () => (weatherEl.textContent = "Location denied")
  );
}

function getWeatherDescription(code) {
  const weatherCodes = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Slight Showers",
    81: "Moderate Showers",
    82: "Violent Showers",
    95: "Thunderstorm",
    96: "Storm + Hail",
    99: "Severe Storm",
  };
  return weatherCodes[code] || "Unknown";
}

function renderQuickLinks() {
  const container = document.getElementById("quickLinks");
  container.innerHTML = "";

  quickLinks.forEach((link) => {
    const linkElement = document.createElement("a");
    linkElement.className = "quick-link";
    linkElement.href = link.url;

    const urlObj = new URL(link.url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;

    linkElement.innerHTML = `
      <img src="${faviconUrl}" alt="" class="favicon">
      <div class="link-title">${link.title}</div>
    `;

    container.appendChild(linkElement);
  });
}
