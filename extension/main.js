// Main controller.
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();

  renderQuickLinks();

  if (pomodoroActive && pomodoroEndTime && pomodoroEndTime > new Date()) {
    startPomodoroTimer();
  } else if (pomodoroActive) {
    pomodoroActive = false;
    saveSetting("pomodoroActive", false);
  }

  if (timerActive && timerEndTime && timerEndTime > new Date()) {
    startTimerCountdown();
  } else if (timerActive) {
    timerActive = false;
    saveSetting("timerActive", false);
  }

  if (stopwatchActive && stopwatchStartTime) {
    startStopwatchCount();
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

  setupEventListeners();

  setInterval(() => {
    updateTime();
    updateProgress();
  }, 1000);
});

function setupEventListeners() {
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
}
