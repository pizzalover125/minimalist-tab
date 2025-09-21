// Hanndle display updates for time, date, progress bar, and pomodoro status.
function updatePomodoroBackground() {
  const body = document.body;

  body.classList.remove(
    "pomodoro-work",
    "pomodoro-break",
    "timer-active",
    "stopwatch-active"
  );

  if (timerActive) {
    body.classList.add("timer-active");
  } else if (stopwatchActive) {
    body.classList.add("stopwatch-active");
  } else if (pomodoroActive) {
    if (pomodoroIsWork) {
      body.classList.add("pomodoro-work");
    } else {
      body.classList.add("pomodoro-break");
    }
  }
}

function updateTime() {
  const now = new Date();
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  const searchProgressEl = document.getElementById("searchProgress");

  if (timerActive && timerEndTime) {
    const timeLeft = Math.max(0, timerEndTime.getTime() - now.getTime());
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    document.getElementById("time").textContent = timeStr;
    document.getElementById("time").style.display = "block";
    document.getElementById("date").style.display = showDate ? "block" : "none";

    pomodoroStatusEl.textContent = "TIMER";
    pomodoroStatusEl.style.display = "block";

    const totalDuration =
      timerEndTime.getTime() - (timerEndTime.getTime() - timeLeft);
    const originalDuration =
      parseInt(localStorage.getItem("timerOriginalDuration")) || timeLeft;
    if (!localStorage.getItem("timerOriginalDuration")) {
      localStorage.setItem("timerOriginalDuration", timeLeft.toString());
    }
    const progressPercent = Math.min(
      100,
      Math.max(0, ((originalDuration - timeLeft) / originalDuration) * 100)
    );
    searchProgressEl.style.width = progressPercent + "%";

    document.getElementById("time").style.color = "#ffa500";
    pomodoroStatusEl.style.color = "#ffa500";

    if (showDate) {
      const dateStr = now.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      document.getElementById("date").textContent = dateStr;
    }
  } else if (stopwatchActive && stopwatchStartTime) {
    const elapsed = now.getTime() - stopwatchStartTime.getTime();
    const minutes = Math.floor(elapsed / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    const milliseconds = Math.floor((elapsed % 1000) / 10);

    const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;

    document.getElementById("time").textContent = timeStr;
    document.getElementById("time").style.display = "block";
    document.getElementById("date").style.display = showDate ? "block" : "none";

    pomodoroStatusEl.textContent = "STOPWATCH";
    pomodoroStatusEl.style.display = "block";

    searchProgressEl.style.width = "0%";

    document.getElementById("time").style.color = "#00ff00";
    pomodoroStatusEl.style.color = "#00ff00";

    if (showDate) {
      const dateStr = now.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      document.getElementById("date").textContent = dateStr;
    }
  } else if (pomodoroActive && pomodoroEndTime) {
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
    localStorage.removeItem("timerOriginalDuration");

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
