// Hanndle weather.
function startWeatherUpdates() {
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  weatherUpdateInterval = setInterval(() => {
    if (showWeather) updateWeather();
  }, 60000);
}

function stopWeatherUpdates() {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
    weatherUpdateInterval = null;
  }
  const weatherEl = document.getElementById("weather");
  weatherEl.style.display = "none";
  weatherEl.textContent = "";
}

function updateWeather() {
  const weatherEl = document.getElementById("weather");
  if (!showWeather) {
    weatherEl.style.display = "none";
    weatherEl.textContent = "";
    return;
  }

  weatherEl.style.display = "block";
  weatherEl.textContent = "...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const tempUnit = useCelsius ? "celsius" : "fahrenheit";
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${tempUnit}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

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
