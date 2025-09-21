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
let pomodoroActive = false;
let pomodoroWorkTime = 25;
let pomodoroBreakTime = 5;
let pomodoroTimer = null;
let pomodoroEndTime = null;
let pomodoroIsWork = true;
let pomodoroSessions = 0;
let audioContext = null;

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
      "pomodoroActive",
      "pomodoroWorkTime",
      "pomodoroBreakTime",
      "pomodoroEndTime",
      "pomodoroIsWork",
      "pomodoroSessions",
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
      pomodoroActive = result.pomodoroActive ?? false;
      pomodoroWorkTime = result.pomodoroWorkTime ?? 25;
      pomodoroBreakTime = result.pomodoroBreakTime ?? 5;
      pomodoroEndTime = result.pomodoroEndTime
        ? new Date(result.pomodoroEndTime)
        : null;
      pomodoroIsWork = result.pomodoroIsWork ?? true;
      pomodoroSessions = result.pomodoroSessions ?? 0;

      renderQuickLinks();

      if (pomodoroActive && pomodoroEndTime && pomodoroEndTime > new Date()) {
        startPomodoroTimer();
      } else if (pomodoroActive) {
        pomodoroActive = false;
        chrome.storage.sync.set({ pomodoroActive: false });
      }

      updateTime();
      updateProgress();
      updatePomodoroBackground();

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

function updatePomodoroBackground() {
  const body = document.body;

  body.classList.remove("pomodoro-work", "pomodoro-break");

  if (pomodoroActive) {
    if (pomodoroIsWork) {
      body.classList.add("pomodoro-work");
    } else {
      body.classList.add("pomodoro-break");
    }
  }
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playBeep(frequency = 800, duration = 200, volume = 1) {
  try {
    const ctx = initAudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + duration / 1000
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.warn("Could not play beep sound:", error);
  }
}

function playPomodoroSound(isWorkEnding) {
  if (isWorkEnding) {
    playBeep(800, 150, 1);
    setTimeout(() => playBeep(800, 150, 1), 200);
    setTimeout(() => playBeep(800, 150, 1), 400);
  } else {
    playBeep(600, 250, 1);
    setTimeout(() => playBeep(600, 250, 1), 350);
  }
}

function openInNewTab(url) {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: url });
  } else {
    window.open(url, "_blank");
  }
}

function handleCommand(query) {
  initAudioContext();

  if (!query) return;

  const addCommandRegex = /^\/add\s+"(.+?)"\s+"(.+?)"$/;
  const removeCommandRegex = /^\/remove\s+"(.+?)"$/;
  const pomodoroCommandRegex = /^\/pomodoro(?:\s+"(\d+)"\s+"(\d+)")?$/;

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

  if (pomodoroCommandRegex.test(query)) {
    const match = query.match(pomodoroCommandRegex);
    if (match[1] && match[2]) {
      pomodoroWorkTime = parseInt(match[1]);
      pomodoroBreakTime = parseInt(match[2]);
    }

    if (pomodoroActive) {
      stopPomodoro();
    } else {
      startPomodoro();
    }
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
      if (pomodoroActive) {
        openInNewTab(finalUrl);
      } else {
        window.location.href = finalUrl;
      }
    } else {
      showAddLinkModal();
      document.getElementById("linkUrl").value = finalUrl;
      document.getElementById("linkTitle").focus();
    }
  } else {
    const searchUrl =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
    if (pomodoroActive) {
      openInNewTab(searchUrl);
    } else {
      window.location.href = searchUrl;
    }
  }
}

function startPomodoro() {
  initAudioContext();

  pomodoroActive = true;
  pomodoroIsWork = true;
  pomodoroEndTime = new Date(Date.now() + pomodoroWorkTime * 60 * 1000);

  chrome.storage.sync.set({
    pomodoroActive: true,
    pomodoroWorkTime,
    pomodoroBreakTime,
    pomodoroEndTime: pomodoroEndTime.toISOString(),
    pomodoroIsWork: true,
    pomodoroSessions,
  });

  updatePomodoroBackground();
  startPomodoroTimer();
}

function stopPomodoro() {
  pomodoroActive = false;
  if (pomodoroTimer) {
    clearTimeout(pomodoroTimer);
    pomodoroTimer = null;
  }

  chrome.storage.sync.set({
    pomodoroActive: false,
    pomodoroEndTime: null,
  });

  updatePomodoroBackground();
  updateTime();
}

function startPomodoroTimer() {
  if (pomodoroTimer) {
    clearTimeout(pomodoroTimer);
  }

  const updatePomodoroDisplay = () => {
    const now = new Date();
    const timeLeft = Math.max(0, pomodoroEndTime.getTime() - now.getTime());

    if (timeLeft <= 0) {
      if (pomodoroIsWork) {
        pomodoroSessions++;
        pomodoroIsWork = false;
        pomodoroEndTime = new Date(Date.now() + pomodoroBreakTime * 60 * 1000);

        playPomodoroSound(true);
        showNotification("Work session complete! Time for a break.");
      } else {
        pomodoroIsWork = true;
        pomodoroEndTime = new Date(Date.now() + pomodoroWorkTime * 60 * 1000);

        playPomodoroSound(false);
        showNotification("Break time over! Back to work.");
      }

      chrome.storage.sync.set({
        pomodoroEndTime: pomodoroEndTime.toISOString(),
        pomodoroIsWork,
        pomodoroSessions,
      });

      updatePomodoroBackground();
    }

    updateTime();

    if (pomodoroActive) {
      pomodoroTimer = setTimeout(updatePomodoroDisplay, 1000);
    }
  };

  updatePomodoroDisplay();
}

function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("Pomodoro Timer", {
      body: message,
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23ff6b6b'/%3E%3Ctext x='32' y='40' text-anchor='middle' fill='white' font-size='24'%3E🍅%3C/text%3E%3C/svg%3E",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showNotification(message);
      }
    });
  }
}

function updateTime() {
  const now = new Date();
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  const searchProgressEl = document.getElementById("searchProgress");

  if (pomodoroActive && pomodoroEndTime) {
    const timeLeft = Math.max(0, pomodoroEndTime.getTime() - now.getTime());
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    const sessionType = pomodoroIsWork ? "WORK" : "BREAK";

    document.getElementById("time").textContent = timeStr;
    document.getElementById("time").style.display = "block";
    document.getElementById("date").style.display = showDate ? "block" : "none";

    pomodoroStatusEl.textContent = sessionType;
    pomodoroStatusEl.style.display = "block";

    const totalTime = pomodoroIsWork
      ? pomodoroWorkTime * 60 * 1000
      : pomodoroBreakTime * 60 * 1000;
    const elapsedTime = totalTime - timeLeft;
    const progressPercent = Math.min(
      100,
      Math.max(0, (elapsedTime / totalTime) * 100)
    );
    searchProgressEl.style.width = progressPercent + "%";

    const timeEl = document.getElementById("time");
    const statusEl = document.getElementById("pomodoroStatus");

    if (pomodoroIsWork) {
      timeEl.style.color = "#ff6b6b";
      statusEl.style.color = "#ff6b6b";
    } else {
      timeEl.style.color = "#4ecdc4";
      statusEl.style.color = "#4ecdc4";
    }

    if (showDate) {
      const dateStr = now.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      document.getElementById("date").textContent = dateStr;
    }
  } else {
    pomodoroStatusEl.style.display = "none";
    searchProgressEl.style.width = "0%";

    document.getElementById("time").style.color = "";

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
  const progressTextEl = progressEl.querySelector(".progress-text");

  progressBar.style.width = progressPercent + "%";
  progressTextEl.textContent = progressText;
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

    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      if (pomodoroActive) {
        openInNewTab(link.url);
      } else {
        window.location.href = link.url;
      }
    });

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
