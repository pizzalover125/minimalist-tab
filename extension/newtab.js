let editingIndex = -1;
let quickLinks = [];
let use24Hour = true;
let showTime = true;
let showDate = true;
let showWeather = false;
let showProgress = false;
let progressType = "day";
let useCelsius = true;
let weatherUpdateInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    [
      "quickLinks",
      "use24Hour",
      "showTime",
      "showDate",
      "showWeather",
      "showProgress",
      "progressType",
      "useCelsius",
    ],
    (result) => {
      quickLinks = result.quickLinks || [
        { title: "YouTube", url: "https://youtube.com" },
        { title: "Amazon", url: "https://amazon.com" },
        { title: "Apple", url: "https://apple.com" },
      ];
      use24Hour = result.use24Hour ?? true;
      showTime = result.showTime ?? true;
      showDate = result.showDate ?? true;
      showWeather = result.showWeather ?? true;
      showProgress = result.showProgress ?? false;
      progressType = result.progressType ?? "day";
      useCelsius = result.useCelsius ?? true;

      renderQuickLinks();
      updateTime();
      updateProgress();

      if (showWeather) {
        updateWeather();
        startWeatherUpdates();
      } else {
        stopWeatherUpdates();
      }
    }
  );

  document
    .getElementById("cancelBtn")
    .addEventListener("click", closeLinkModal);
  document.getElementById("saveBtn").addEventListener("click", saveLinkModal);
  document.getElementById("deleteBtn").addEventListener("click", deleteLink);

  document.getElementById("searchBox").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleCommand(e.target.value.trim());
      e.target.value = "";
    }
  });

  document.getElementById("linkModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeLinkModal();
  });

  setInterval(() => {
    updateTime();
    updateProgress();
  }, 1000);
});

function handleCommand(query) {
  if (!query) return;

  const addCommandRegex = /^\/add\s+"(.+?)"\s+"(.+?)"$/;
  const removeCommandRegex = /^\/remove\s+"(.+?)"$/;

  if (addCommandRegex.test(query)) {
    const [, title, url] = query.match(addCommandRegex);
    const finalUrl = url.startsWith("http") ? url : "https://" + url;
    quickLinks.push({ title, url: finalUrl });
    chrome.storage.sync.set({ quickLinks }, renderQuickLinks);
    return;
  }

  if (removeCommandRegex.test(query)) {
    const [, titleToRemove] = query.match(removeCommandRegex);
    quickLinks = quickLinks.filter((link) => link.title !== titleToRemove);
    chrome.storage.sync.set({ quickLinks }, renderQuickLinks);
    return;
  }

  if (query === "/24hr") {
    use24Hour = true;
    chrome.storage.sync.set({ use24Hour }, updateTime);
    return;
  }
  if (query === "/12hr") {
    use24Hour = false;
    chrome.storage.sync.set({ use24Hour }, updateTime);
    return;
  }
  if (query === "/time") {
    showTime = !showTime;
    chrome.storage.sync.set({ showTime }, updateTime);
    return;
  }
  if (query === "/date") {
    showDate = !showDate;
    chrome.storage.sync.set({ showDate }, updateTime);
    return;
  }
  if (query === "/weather") {
    showWeather = !showWeather;
    chrome.storage.sync.set({ showWeather }, () => {
      if (showWeather) {
        updateWeather();
        startWeatherUpdates();
      } else {
        stopWeatherUpdates();
      }
    });
    return;
  }
  if (query === "/progress") {
    showProgress = !showProgress;
    chrome.storage.sync.set({ showProgress }, updateProgress);
    return;
  }
  if (query === "/day") {
    progressType = "day";
    chrome.storage.sync.set({ progressType }, updateProgress);
    return;
  }
  if (query === "/hour") {
    progressType = "hour";
    chrome.storage.sync.set({ progressType }, updateProgress);
    return;
  }
  if (query === "/c") {
    useCelsius = true;
    chrome.storage.sync.set({ useCelsius }, updateWeather);
    return;
  }
  if (query === "/f") {
    useCelsius = false;
    chrome.storage.sync.set({ useCelsius }, updateWeather);
    return;
  }

  const isUrl = query.includes(".") && !query.includes(" ");
  if (isUrl) {
    const finalUrl = query.startsWith("http") ? query : "https://" + query;
    const existingIndex = quickLinks.findIndex((link) => link.url === finalUrl);
    if (existingIndex >= 0) {
      window.location.href = finalUrl;
    } else {
      showAddLinkModal();
      document.getElementById("linkUrl").value = finalUrl;
      document.getElementById("linkTitle").focus();
    }
  } else {
    window.location.href =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
  }
}

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

  document.getElementById("time").style.display = showTime ? "block" : "none";
  document.getElementById("date").style.display = showDate ? "block" : "none";

  if (showTime) document.getElementById("time").textContent = timeStr;
  if (showDate) document.getElementById("date").textContent = dateStr;
}

function updateProgress() {
  const progressEl = document.getElementById("progress");
  if (!showProgress) {
    progressEl.style.display = "none";
    return;
  }

  progressEl.style.display = "block";

  const now = new Date();
  let progressPercent;
  let progressText;

  if (progressType === "hour") {
    const startOfHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0,
      0
    );
    const endOfHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      59,
      59,
      999
    );

    const totalHourMs = endOfHour.getTime() - startOfHour.getTime();
    const elapsedMs = now.getTime() - startOfHour.getTime();
    progressPercent = Math.min(
      100,
      Math.max(0, (elapsedMs / totalHourMs) * 100)
    );
    progressText = `${Math.round(progressPercent)}% of hour complete`;
  } else {
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const totalDayMs = endOfDay.getTime() - startOfDay.getTime();
    const elapsedMs = now.getTime() - startOfDay.getTime();
    progressPercent = Math.min(
      100,
      Math.max(0, (elapsedMs / totalDayMs) * 100)
    );
    progressText = `${Math.round(progressPercent)}% of day complete`;
  }

  const progressBar = progressEl.querySelector(".progress-bar");

  progressBar.style.width = progressPercent + "%";
  progressText.textContent = progressText;
}

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

function renderQuickLinks() {
  const container = document.getElementById("quickLinks");
  container.innerHTML = "";

  quickLinks.forEach((link, index) => {
    const linkElement = document.createElement("a");
    linkElement.className = "quick-link";
    linkElement.href = link.url;

    const urlObj = new URL(link.url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;

    linkElement.innerHTML = `
      <img src="${faviconUrl}" alt="" class="favicon">
      <div class="link-title">${link.title}</div>
    `;

    linkElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      editLink(index);
    });

    container.appendChild(linkElement);
  });
}

function showAddLinkModal() {
  editingIndex = -1;
  document.getElementById("modalTitle").textContent = "Add Quick Link";
  document.getElementById("linkTitle").value = "";
  document.getElementById("linkUrl").value = "";
  document.getElementById("linkModal").style.display = "flex";
  document.getElementById("deleteBtn").style.display = "none";
}

function editLink(index) {
  editingIndex = index;
  const link = quickLinks[index];
  document.getElementById("modalTitle").textContent = "Edit Quick Link";
  document.getElementById("linkTitle").value = link.title;
  document.getElementById("linkUrl").value = link.url;
  document.getElementById("linkModal").style.display = "flex";
  document.getElementById("deleteBtn").style.display = "inline-block";
}

function closeLinkModal() {
  document.getElementById("linkModal").style.display = "none";
}

function saveLinkModal() {
  const title = document.getElementById("linkTitle").value.trim();
  const url = document.getElementById("linkUrl").value.trim();
  if (!title || !url) return;

  const finalUrl = url.startsWith("http") ? url : "https://" + url;

  if (editingIndex >= 0) {
    quickLinks[editingIndex] = { title, url: finalUrl };
  } else {
    quickLinks.push({ title, url: finalUrl });
  }

  chrome.storage.sync.set({ quickLinks }, () => {
    renderQuickLinks();
    closeLinkModal();
  });
}

function deleteLink() {
  if (editingIndex >= 0) {
    quickLinks.splice(editingIndex, 1);
    chrome.storage.sync.set({ quickLinks }, () => {
      renderQuickLinks();
      closeLinkModal();
    });
  }
}
