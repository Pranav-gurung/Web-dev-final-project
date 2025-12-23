const navBtns = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

function showPage(id) {
  pages.forEach(p => p.classList.remove('page--active'));
  document.getElementById(`page-${id}`).classList.add('page--active');

  navBtns.forEach(b => b.classList.remove('active'));
  document
    .querySelector(`.nav-item[data-page="${id}"]`)
    .classList.add('active');
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.page);
  });
});

// ---- STATE ----
const state = {
  hydration: 0,          // cups
  hydrationGoal: 8,
  bodyHistory: [],
  lastBMI: null,
  lastSleep: null,
  sleepHistory: [],
  lastStress: null,
  stressHistory: []
};

// helper: format time
function timeNow() {
  return new Date().toLocaleString();
}

// ---- DASHBOARD UPDATE ----
function updateDashboard() {
  document.getElementById('dash-water').textContent =
    `${state.hydration} / ${state.hydrationGoal} cups`;

  const sleepText = state.lastSleep
    ? `${state.lastSleep.hours} h (${state.lastSleep.quality})`
    : '0 h';
  document.getElementById('dash-sleep').textContent = sleepText;

  const bmiText = state.lastBMI ? `BMI: ${state.lastBMI.bmi}` : 'BMI: –';
  document.getElementById('dash-bmi').textContent = bmiText;

  const stressText = state.lastStress
    ? `${state.lastStress.level}`
    : 'Not logged';
  document.getElementById('dash-stress').textContent = stressText;
}

// ---- HYDRATION ----
const hydrationForm = document.getElementById('hydration-form');
const hydrationInput = document.getElementById('hydration-input');
const hydrationSummary = document.getElementById('hydration-summary');
const hydrationBar = document.getElementById('hydration-bar');
const hydrationList = document.getElementById('hydration-list');

function updateHydrationUI() {
  hydrationSummary.textContent =
    `${state.hydration} / ${state.hydrationGoal} cups`;
  const percent = Math.min(
    100,
    (state.hydration / state.hydrationGoal) * 100
  );
  hydrationBar.style.width = percent + '%';
  updateDashboard();
}

function addHydrationEntry(amount) {
  state.hydration = +(state.hydration + amount).toFixed(2);

  if (hydrationList.classList.contains('empty-note')) {
    hydrationList.classList.remove('empty-note');
    hydrationList.textContent = '';
  }

  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div>
      <div class="entry-main">${amount} cups</div>
      <div class="entry-meta">${timeNow()}</div>
    </div>
  `;
  hydrationList.prepend(div);

  updateHydrationUI();
}

hydrationForm.addEventListener('submit', e => {
  e.preventDefault();
  const val = parseFloat(hydrationInput.value);
  if (!val || val <= 0) return;
  addHydrationEntry(val);
  hydrationForm.reset();
});

// ---- BODY METRICS ----
const bodyForm = document.getElementById('body-form');
const weightInput = document.getElementById('body-weight');
const heightInput = document.getElementById('body-height');
const bmiResult = document.getElementById('bmi-result');
const bodyList = document.getElementById('body-list');

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function addBodyEntry(weight, height, bmi) {
  state.lastBMI = { weight, height, bmi };
  state.bodyHistory.push({ weight, height, bmi, at: timeNow() });

  bmiResult.textContent = `BMI: ${bmi} (${bmiCategory(bmi)})`;

  if (bodyList.classList.contains('empty-note')) {
    bodyList.classList.remove('empty-note');
    bodyList.textContent = '';
  }

  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `
    <div>
      <div class="entry-main">${weight} kg • ${height} cm</div>
      <div class="entry-meta">BMI ${bmi} · ${timeNow()}</div>
    </div>
  `;
  bodyList.prepend(item);
  updateDashboard();
}

bodyForm.addEventListener('submit', e => {
  e.preventDefault();
  const w = parseFloat(weightInput.value);
  const hCm = parseFloat(heightInput.value);
  if (!w || !hCm) return;
  const hM = hCm / 100;
  const bmi = +(w / (hM * hM)).toFixed(1);
  addBodyEntry(w, hCm, bmi);
  bodyForm.reset();
});

// ---- SLEEP ----
const sleepForm = document.getElementById('sleep-form');
const sleepHours = document.getElementById('sleep-hours');
const sleepQuality = document.getElementById('sleep-quality');
const sleepSummary = document.getElementById('sleep-summary');
const sleepList = document.getElementById('sleep-list');

function addSleepEntry(hours, quality) {
  const entry = { hours, quality, at: timeNow() };
  state.lastSleep = entry;
  state.sleepHistory.push(entry);

  sleepSummary.textContent = `${hours} h (${quality})`;

  if (sleepList.classList.contains('empty-note')) {
    sleepList.classList.remove('empty-note');
    sleepList.textContent = '';
  }

  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `
    <div>
      <div class="entry-main">${hours} h • ${quality}</div>
      <div class="entry-meta">${entry.at}</div>
    </div>
  `;
  sleepList.prepend(item);
  updateDashboard();
}

sleepForm.addEventListener('submit', e => {
  e.preventDefault();
  const h = parseFloat(sleepHours.value);
  const q = sleepQuality.value;
  if (!h || !q) return;
  addSleepEntry(h, q);
  sleepForm.reset();
});

// ---- STRESS ----
const stressForm = document.getElementById('stress-form');
const stressLevel = document.getElementById('stress-level');
const stressNote = document.getElementById('stress-note');
const stressSummary = document.getElementById('stress-summary');
const stressList = document.getElementById('stress-list');

function addStressEntry(level, note) {
  const entry = { level, note, at: timeNow() };
  state.lastStress = entry;
  state.stressHistory.push(entry);

  stressSummary.textContent = level;

  if (stressList.classList.contains('empty-note')) {
    stressList.classList.remove('empty-note');
    stressList.textContent = '';
  }

  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `
    <div>
      <div class="entry-main">${level}</div>
      <div class="entry-meta">${entry.at}${note ? ' • ' + note : ''}</div>
    </div>
  `;
  stressList.prepend(item);
  updateDashboard();
}

stressForm.addEventListener('submit', e => {
  e.preventDefault();
  const level = stressLevel.value;
  const note = stressNote.value.trim();
  if (!level) return;
  addStressEntry(level, note);
  stressForm.reset();
});

// initial dashboard
updateDashboard();
