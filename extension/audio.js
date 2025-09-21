// Hanndle audio.
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

function playTimerSound() {
  playBeep(1000, 300, 1);
  setTimeout(() => playBeep(800, 300, 1), 400);
  setTimeout(() => playBeep(1000, 300, 1), 800);
  setTimeout(() => playBeep(800, 300, 1), 1200);
}

function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("Timer", {
      body: message,
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23ff6b6b'/%3E%3Ctext x='32' y='40' text-anchor='middle' fill='white' font-size='24'%3E⏰%3C/text%3E%3C/svg%3E",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showNotification(message);
      }
    });
  }
}
