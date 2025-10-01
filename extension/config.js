// Store variables + default settings
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
let timerActive = false;
let timerEndTime = null;
let timerInterval = null;
let stopwatchActive = false;
let stopwatchStartTime = null;
let stopwatchInterval = null;
let stopwatchElapsed = 0;

const DEFAULT_SETTINGS = {
  quickLinks: [
    { title: "YouTube", url: "https://youtube.com" },
    { title: "Amazon", url: "https://amazon.com" },
    { title: "Apple", url: "https://apple.com" },
  ],
  use24Hour: true,
  showTime: true,
  showDate: true,
  showWeather: true,
  showProgress: false,
  progressType: "day",
  useCelsius: true,
  pomodoroActive: false,
  pomodoroWorkTime: 25,
  pomodoroBreakTime: 5,
  pomodoroIsWork: true,
  pomodoroSessions: 0,
  timerActive: false,
  stopwatchActive: false,
  stopwatchElapsed: 0,
  stickyNotes: [],
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
      quickLinks = result.quickLinks || DEFAULT_SETTINGS.quickLinks;
      use24Hour = result.use24Hour ?? DEFAULT_SETTINGS.use24Hour;
      showTime = result.showTime ?? DEFAULT_SETTINGS.showTime;
      showDate = result.showDate ?? DEFAULT_SETTINGS.showDate;
      showWeather = result.showWeather ?? DEFAULT_SETTINGS.showWeather;
      showProgress = result.showProgress ?? DEFAULT_SETTINGS.showProgress;
      progressType = result.progressType ?? DEFAULT_SETTINGS.progressType;
      useCelsius = result.useCelsius ?? DEFAULT_SETTINGS.useCelsius;
      pomodoroActive = result.pomodoroActive ?? DEFAULT_SETTINGS.pomodoroActive;
      pomodoroWorkTime =
        result.pomodoroWorkTime ?? DEFAULT_SETTINGS.pomodoroWorkTime;
      pomodoroBreakTime =
        result.pomodoroBreakTime ?? DEFAULT_SETTINGS.pomodoroBreakTime;
      pomodoroEndTime = result.pomodoroEndTime
        ? new Date(result.pomodoroEndTime)
        : null;
      pomodoroIsWork = result.pomodoroIsWork ?? DEFAULT_SETTINGS.pomodoroIsWork;
      pomodoroSessions =
        result.pomodoroSessions ?? DEFAULT_SETTINGS.pomodoroSessions;
      timerActive = result.timerActive ?? DEFAULT_SETTINGS.timerActive;
      timerEndTime = result.timerEndTime ? new Date(result.timerEndTime) : null;
      stopwatchActive =
        result.stopwatchActive ?? DEFAULT_SETTINGS.stopwatchActive;
      stopwatchStartTime = result.stopwatchStartTime
        ? new Date(result.stopwatchStartTime)
        : null;
      stopwatchElapsed =
        result.stopwatchElapsed ?? DEFAULT_SETTINGS.stopwatchElapsed;

      resolve();
    });
  });
}

function saveSetting(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

function saveSettings(settings) {
  chrome.storage.sync.set(settings);
}
