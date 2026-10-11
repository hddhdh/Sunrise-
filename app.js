const CITY = { latitude: 33.8938, longitude: 35.5018, timeZone: 'Asia/Beirut' };
const LEAD_MS = 2.5 * 60 * 60 * 1000;
const $ = (id) => document.getElementById(id);
let sunriseAt;
let alarmTimer;

function beirutDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: CITY.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function timeLabel(date) {
  return new Intl.DateTimeFormat('en', { timeZone: CITY.timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}
function dateLabel(date) {
  return new Intl.DateTimeFormat('en', { timeZone: CITY.timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }

async function loadSunrise() {
  $('alarm-button').disabled = true;
  try {
    const date = beirutDate();
    const url = `https://api.sunrise-sunset.org/json?lat=${CITY.latitude}&lng=${CITY.longitude}&date=${date}&formatted=0`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sunrise service returned ${response.status}`);
    const payload = await response.json();
    if (payload.status !== 'OK') throw new Error('Sunrise data is unavailable right now.');
    sunriseAt = new Date(payload.results.sunrise);
    const alarmAt = new Date(sunriseAt.getTime() - LEAD_MS);
    $('sunrise-time').textContent = timeLabel(sunriseAt);
    $('sunrise-date').textContent = dateLabel(sunriseAt);
    $('alarm-time').textContent = timeLabel(alarmAt);
    $('alarm-button').disabled = false;
    $('alarm-button').textContent = 'Set reminder for today';
    status('Sunrise time updated for Beirut.');
    restoreAlarm();
  } catch (error) {
    status(`Couldn't load sunrise time. Check your connection and try again. (${error.message})`, true);
    $('alarm-button').textContent = 'Retry';
    $('alarm-button').disabled = false;
    $('alarm-button').onclick = loadSunrise;
  }
}

function clearAlarm() {
  if (alarmTimer) clearTimeout(alarmTimer);
  alarmTimer = undefined;
  localStorage.removeItem('beirut-sunrise-alarm');
}
function armAlarm(target, showConfirmation = true) {
  clearAlarm();
  const delay = target.getTime() - Date.now();
  if (delay <= 0) {
    status('The reminder time has already passed for today.');
    $('alarm-button').textContent = 'Set reminder for today';
    return;
  }
  localStorage.setItem('beirut-sunrise-alarm', JSON.stringify({ target: target.toISOString(), sunrise: sunriseAt.toISOString() }));
  alarmTimer = setTimeout(() => {
    const notification = new Notification('Beirut sunrise reminder', {
      body: `Sunrise is in about 2½ hours, at ${timeLabel(sunriseAt)}.`,
      icon: 'icon.svg',
      tag: 'beirut-sunrise-reminder'
    });
    notification.onclick = () => { window.focus(); notification.close(); };
    clearAlarm();
    status('Your sunrise reminder has fired.');
    $('alarm-button').textContent = 'Set reminder for today';
  }, delay);
  $('alarm-button').textContent = 'Cancel reminder';
  status(showConfirmation ? `Reminder set for ${timeLabel(target)}. Keep this page open.` : `Reminder restored for ${timeLabel(target)}. Keep this page open.`);
}
function restoreAlarm() {
  const saved = localStorage.getItem('beirut-sunrise-alarm');
  if (!saved) return;
  try {
    const alarm = JSON.parse(saved);
    const savedSunrise = new Date(alarm.sunrise);
    const target = new Date(alarm.target);
    if (target > new Date() && savedSunrise > new Date() && savedSunrise - new Date() < 36 * 60 * 60 * 1000) {
      sunriseAt = savedSunrise;
      $('sunrise-time').textContent = timeLabel(sunriseAt);
      $('sunrise-date').textContent = dateLabel(sunriseAt);
      $('alarm-time').textContent = timeLabel(target);
      armAlarm(target, false);
      return;
    }
  } catch { /* Ignore stale or malformed local storage. */ }
  clearAlarm();
}

$('alarm-button').addEventListener('click', async () => {
  if ($('alarm-button').textContent === 'Retry') { await loadSunrise(); return; }
  if (localStorage.getItem('beirut-sunrise-alarm')) { clearAlarm(); $('alarm-button').textContent = 'Set reminder for today'; status('Reminder cancelled.'); return; }
  if (!('Notification' in window)) { status('Notifications are not supported by this browser.', true); return; }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { status('Please allow notifications to set the reminder.', true); return; }
  let target = new Date(sunriseAt.getTime() - LEAD_MS);
  // If today's 2½-hour-before time has passed, schedule against the next sunrise instead.
  if (target <= new Date()) {
    try {
      const tomorrow = new Date(sunriseAt.getTime() + 24 * 60 * 60 * 1000);
      const nextDate = beirutDate(tomorrow);
      const r = await fetch(`https://api.sunrise-sunset.org/json?lat=${CITY.latitude}&lng=${CITY.longitude}&date=${nextDate}&formatted=0`);
      const j = await r.json();
      if (!r.ok || j.status !== 'OK') throw new Error('Could not get tomorrow’s sunrise.');
      sunriseAt = new Date(j.results.sunrise);
      target = new Date(sunriseAt.getTime() - LEAD_MS);
      $('sunrise-time').textContent = timeLabel(sunriseAt);
      $('sunrise-date').textContent = dateLabel(sunriseAt);
      $('alarm-time').textContent = timeLabel(target);
      $('alarm-button').textContent = 'Set reminder for today';
    } catch (error) { status(error.message, true); return; }
  }
  armAlarm(target);
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
loadSunrise();
