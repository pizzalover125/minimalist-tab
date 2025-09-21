// Hanndle commands.
function handleCommand(query) {
  initAudioContext();

  if (!query) return;

  const addCommandRegex = /^\/add\s+"(.+?)"\s+"(.+?)"$/;
  const removeCommandRegex = /^\/remove\s+"(.+?)"$/;
  const pomodoroCommandRegex = /^\/pomodoro(?:\s+"(\d+)"\s+"(\d+)")?$/;
  const timerCommandRegex = /^\/timer\s+"(\d+)"\s+"(\d+)"$/;

  if (addCommandRegex.test(query)) {
    const [, title, url] = query.match(addCommandRegex);
    const finalUrl = url.startsWith("http") ? url : "https://" + url;
    quickLinks.push({ title, url: finalUrl });
    saveSetting("quickLinks", quickLinks);
    renderQuickLinks();
    return;
  }

  if (removeCommandRegex.test(query)) {
    const [, titleToRemove] = query.match(removeCommandRegex);
    quickLinks = quickLinks.filter((link) => link.title !== titleToRemove);
    saveSetting("quickLinks", quickLinks);
    renderQuickLinks();
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

  if (timerCommandRegex.test(query)) {
    const [, minutes, seconds] = query.match(timerCommandRegex);
    const totalMs = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;

    if (timerActive) {
      stopTimer();
    } else {
      startTimer(totalMs);
    }
    return;
  }

  if (query === "/stopwatch") {
    if (stopwatchActive) {
      stopStopwatch();
    } else {
      startStopwatch();
    }
    return;
  }

  if (query === "/24hr") {
    use24Hour = true;
    saveSetting("use24Hour", use24Hour);
    updateTime();
    return;
  }

  if (query === "/12hr") {
    use24Hour = false;
    saveSetting("use24Hour", use24Hour);
    updateTime();
    return;
  }

  if (query === "/time") {
    showTime = !showTime;
    saveSetting("showTime", showTime);
    updateTime();
    return;
  }

  if (query === "/date") {
    showDate = !showDate;
    saveSetting("showDate", showDate);
    updateTime();
    return;
  }

  if (query === "/weather") {
    showWeather = !showWeather;
    saveSetting("showWeather", showWeather);
    if (showWeather) {
      updateWeather();
      startWeatherUpdates();
    } else {
      stopWeatherUpdates();
    }
    return;
  }

  if (query === "/progress") {
    showProgress = !showProgress;
    saveSetting("showProgress", showProgress);
    updateProgress();
    return;
  }

  if (query === "/day") {
    progressType = "day";
    saveSetting("progressType", progressType);
    updateProgress();
    return;
  }

  if (query === "/hour") {
    progressType = "hour";
    saveSetting("progressType", progressType);
    updateProgress();
    return;
  }

  if (query === "/c") {
    useCelsius = true;
    saveSetting("useCelsius", useCelsius);
    updateWeather();
    return;
  }

  if (query === "/f") {
    useCelsius = false;
    saveSetting("useCelsius", useCelsius);
    updateWeather();
    return;
  }

  const isUrl = query.includes(".") && !query.includes(" ");
  if (isUrl) {
    const finalUrl = query.startsWith("http") ? query : "https://" + query;
    const existingIndex = quickLinks.findIndex((link) => link.url === finalUrl);
    if (existingIndex >= 0) {
      if (pomodoroActive || timerActive || stopwatchActive) {
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
    if (pomodoroActive || timerActive || stopwatchActive) {
      openInNewTab(searchUrl);
    } else {
      window.location.href = searchUrl;
    }
  }
}
