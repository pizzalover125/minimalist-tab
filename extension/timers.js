// Handle pomodoro, timer, and stopwatch.
function startTimer(durationMs) {
  initAudioContext();

  timerActive = true;
  timerEndTime = new Date(Date.now() + durationMs);

  saveSettings({
    timerActive: true,
    timerEndTime: timerEndTime.toISOString(),
  });

  updatePomodoroBackground();
  startTimerCountdown();
}

function stopTimer() {
  timerActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  saveSettings({
    timerActive: false,
    timerEndTime: null,
  });

  updatePomodoroBackground();
  updateTime();
}

function startTimerCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    const now = new Date();
    const timeLeft = Math.max(0, timerEndTime.getTime() - now.getTime());

    if (timeLeft <= 0) {
      playTimerSound();
      showNotification("Timer finished!");
      stopTimer();
    }

    updateTime();
  }, 100);
}

function startStopwatch() {
  initAudioContext();

  stopwatchActive = true;
  stopwatchElapsed = 0;
  stopwatchStartTime = new Date();

  saveSettings({
    stopwatchActive: true,
    stopwatchStartTime: stopwatchStartTime.toISOString(),
    stopwatchElapsed: 0,
  });

  updatePomodoroBackground();
  startStopwatchCount();
}

function stopStopwatch() {
  stopwatchActive = false;
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }

  const now = new Date();
  if (stopwatchStartTime) {
    stopwatchElapsed = now.getTime() - stopwatchStartTime.getTime();
  }

  saveSettings({
    stopwatchActive: false,
    stopwatchElapsed: stopwatchElapsed,
  });

  updatePomodoroBackground();
  updateTime();
}

function startStopwatchCount() {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
  }

  stopwatchInterval = setInterval(() => {
    updateTime();
  }, 50);
}

function startPomodoro() {
  initAudioContext();

  pomodoroActive = true;
  pomodoroIsWork = true;
  pomodoroEndTime = new Date(Date.now() + pomodoroWorkTime * 60 * 1000);

  saveSettings({
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

  saveSettings({
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

      saveSettings({
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
