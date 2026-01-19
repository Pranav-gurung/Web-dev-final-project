// --- DOM ELEMENTS ---
const navBtns = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const loginModal = document.getElementById('loginModal');
const openLoginBtn = document.getElementById('openLogin');
const closeBtn = document.querySelector('.close-btn');
const loginFormActual = document.getElementById('login-form-actual');

// NEW FEEDBACK CONSTANTS
const feedbackModal = document.getElementById('feedbackModal');
const openFeedbackBtn = document.getElementById('openFeedback');
const closeFeedbackBtn = document.querySelector('.close-feedback');
const feedbackFormActual = document.getElementById('feedback-form-actual');

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// HELPER: Get the currently selected day index from the Universal Selector
function getSelectedDayIndex() {
  const selector = document.getElementById('global-day-select');
  return selector ? parseInt(selector.value) : 6; // Default to Sunday
}

function showPage(id) {
  if (!id) return;
  pages.forEach(p => p.classList.remove('page--active'));
  const targetPage = document.getElementById(`page-${id}`);
  if (targetPage) {
    targetPage.classList.add('page--active');
  }
  navBtns.forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const pageId = btn.dataset.page;
    if (pageId) {
      showPage(pageId);
    }
  });
});

const state = {
  hydration: 0,
  hydrationGoal: 8,
  bodyHistory: [],
  lastBMI: null,
  lastSleep: null,
  sleepHistory: [],
  lastStress: null,
  stressHistory: []
};

function timeNow() {
  return new Date().toLocaleString();
}

function updateDashboard() {
  const dashWater = document.getElementById('dash-water');
  const dashSleep = document.getElementById('dash-sleep');
  const dashBmi = document.getElementById('dash-bmi');
  const dashStress = document.getElementById('dash-stress');

  if (dashWater) dashWater.textContent = `${state.hydration} / ${state.hydrationGoal} cups`;
  
  const sleepText = state.lastSleep ? `${state.lastSleep.hours} h (${state.lastSleep.quality})` : '0 h';
  if (dashSleep) dashSleep.textContent = sleepText;
  
  const bmiText = state.lastBMI ? `BMI: ${state.lastBMI.bmi}` : 'BMI: –';
  if (dashBmi) dashBmi.textContent = bmiText;
  
  const stressDisplay = state.lastStress ? state.lastStress.level : 'Not logged';
  if (dashStress) dashStress.textContent = stressDisplay;
}

// HYDRATION LOGIC
const hydrationForm = document.getElementById('hydration-form');
const hydrationInput = document.getElementById('hydration-input');
const hydrationSummary = document.getElementById('hydration-summary');
const hydrationBar = document.getElementById('hydration-bar');
const hydrationList = document.getElementById('hydration-list');

function updateHydrationUI() {
  if (hydrationSummary) hydrationSummary.textContent = `${state.hydration} / ${state.hydrationGoal} cups`;
  const percent = Math.min(100, (state.hydration / state.hydrationGoal) * 100);
  if (hydrationBar) hydrationBar.style.width = percent + '%';
  updateDashboard();
}

function addHydrationEntry(amount) {
  state.hydration = +(state.hydration + amount).toFixed(2);
  
  // Use Universal Day Index
  const dayIdx = getSelectedDayIndex();
  wellnessChart.data.datasets[0].data[dayIdx] = state.hydration;
  wellnessChart.update();

  if (hydrationList && hydrationList.classList.contains('empty-note')) {
    hydrationList.classList.remove('empty-note');
    hydrationList.textContent = '';
  }
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `<div><div class="entry-main">${amount} cups (${daysOfWeek[dayIdx]})</div><div class="entry-meta">${timeNow()}</div></div>`;
  if (hydrationList) hydrationList.prepend(div);
  updateHydrationUI();
}

if (hydrationForm) {
  hydrationForm.addEventListener('submit', e => {
    e.preventDefault();
    const val = parseFloat(hydrationInput.value);
    if (!val || val <= 0) return;
    addHydrationEntry(val);
    hydrationForm.reset();
  });
}

// BODY METRICS
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
  
  // Use Universal Day Index (Weight Line)
  const dayIdx = getSelectedDayIndex();
  wellnessChart.data.datasets[3].data[dayIdx] = weight;
  wellnessChart.update();

  if (bmiResult) bmiResult.textContent = `BMI: ${bmi} (${bmiCategory(bmi)})`;
  if (bodyList && bodyList.classList.contains('empty-note')) {
    bodyList.classList.remove('empty-note');
    bodyList.textContent = '';
  }
  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `<div><div class="entry-main">${weight} kg (${daysOfWeek[dayIdx]})</div><div class="entry-meta">BMI ${bmi} · ${timeNow()}</div></div>`;
  if (bodyList) bodyList.prepend(item);
  updateDashboard();
}

if (bodyForm) {
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
}

// SLEEP LOGIC
const sleepForm = document.getElementById('sleep-form');
const sleepHours = document.getElementById('sleep-hours');
const sleepQuality = document.getElementById('sleep-quality');
const sleepSummary = document.getElementById('sleep-summary');
const sleepList = document.getElementById('sleep-list');

function addSleepEntry(hours, quality) {
  const entry = { hours, quality, at: timeNow() };
  state.lastSleep = entry;
  state.sleepHistory.push(entry);

  // Use Universal Day Index (Sleep Bar)
  const dayIdx = getSelectedDayIndex();
  wellnessChart.data.datasets[2].data[dayIdx] = hours;
  wellnessChart.update();

  if (sleepSummary) sleepSummary.textContent = `${hours} h (${quality})`;
  if (sleepList && sleepList.classList.contains('empty-note')) {
    sleepList.classList.remove('empty-note');
    sleepList.textContent = '';
  }
  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `<div><div class="entry-main">${hours} h (${daysOfWeek[dayIdx]})</div><div class="entry-meta">${entry.at}</div></div>`;
  if (sleepList) sleepList.prepend(item);
  updateDashboard();
}

if (sleepForm) {
  sleepForm.addEventListener('submit', e => {
    e.preventDefault();
    const h = parseFloat(sleepHours.value);
    const q = sleepQuality.value;
    if (!h || !q) return;
    addSleepEntry(h, q);
    sleepForm.reset();
  });
}

// STRESS LOGIC
const stressForm = document.getElementById('stress-form');
const stressLevel = document.getElementById('stress-level');
const stressNote = document.getElementById('stress-note');
const stressSummary = document.getElementById('stress-summary');
const stressList = document.getElementById('stress-list');

function addStressEntry(level, note) {
  const entry = { level, note, at: timeNow() };
  state.lastStress = entry;
  state.stressHistory.push(entry);

  // Use Universal Day Index (Stress Line)
  const dayIdx = getSelectedDayIndex();
  const stressMapping = { 'Low': 2, 'Medium': 5, 'High': 8 }; 
  wellnessChart.data.datasets[1].data[dayIdx] = stressMapping[level] || 0;
  wellnessChart.update();

  if (stressSummary) stressSummary.textContent = level;
  if (stressList && stressList.classList.contains('empty-note')) {
    stressList.classList.remove('empty-note');
    stressList.textContent = '';
  }
  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `<div><div class="entry-main">${level} (${daysOfWeek[dayIdx]})</div><div class="entry-meta">${entry.at}${note ? ' • ' + note : ''}</div></div>`;
  if (stressList) stressList.prepend(item);
  updateDashboard();
}

if (stressForm) {
  stressForm.addEventListener('submit', e => {
    e.preventDefault();
    const level = stressLevel.value;
    const note = stressNote.value.trim();
    if (!level) return;
    addStressEntry(level, note);
    stressForm.reset();
  });
}

// MODAL CONTROLS (LOGIN)
if (openLoginBtn) openLoginBtn.addEventListener('click', () => { loginModal.style.display = 'flex'; });
if (closeBtn) closeBtn.addEventListener('click', () => { loginModal.style.display = 'none'; });

loginFormActual.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    const emailField = document.getElementById('login-email');
    const phoneField = document.getElementById('login-phone');
    const msg = document.getElementById('login-msg');

    const emailValue = emailField.value.trim().toLowerCase();
    const phoneValue = phoneField.value.trim();

    // 1. GMAIL CHECK
    if (!emailValue.endsWith('@gmail.com') || emailValue.length <= 10) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "enter valid gmail";
        emailField.focus();
        return; 
    } 

    // 2. PHONE CHECK
    const indianPhonePattern = /^[6-9][0-9]{9}$/; 
    
    if (!indianPhonePattern.test(phoneValue)) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "enter valid mobile number";
        phoneField.focus();
        return; 
    } 

    // 3. SUCCESS
    msg.style.color = "#2ecc71";
    msg.textContent = "Verified. Syncing data...";
    
    setTimeout(() => { 
        loginModal.style.display = 'none'; 
        loginFormActual.reset(); 
        msg.textContent = ""; 
    }, 1500);
});

// MODAL CONTROLS (FEEDBACK)
if (openFeedbackBtn) openFeedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'flex'; });
if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'none'; });

// Added global window click to close modals if clicking outside
window.addEventListener('click', (e) => { 
    if (e.target === feedbackModal) feedbackModal.style.display = 'none'; 
    if (e.target === loginModal) loginModal.style.display = 'none';
});

feedbackFormActual.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('feedback-msg');
    msg.style.color = "#6c3bff";
    msg.textContent = "Thank you! Feedback received.";
    setTimeout(() => { 
        feedbackModal.style.display = 'none'; 
        feedbackFormActual.reset(); 
        msg.textContent = ""; 
    }, 1500);
});

// CHART INITIALIZATION
const wellnessChart = new Chart(document.getElementById('wellnessChart').getContext('2d'), {
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Water (Cups)',
                type: 'bar',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(37, 99, 235, 0.6)',
                borderColor: '#2563eb',
                borderWidth: 1
            },
            {
                label: 'Stress Level',
                type: 'line',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#ec4899',
                tension: 0.3,
                fill: false
            },
            {
                label: 'Sleep (Hours)',
                type: 'bar',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(166, 59, 255, 0.6)',
                borderColor: '#a63bff',
                borderWidth: 1
            },
            {
                label: 'Weight (kg)',
                type: 'line',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#22c55e',
                tension: 0.3,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
    }
});

updateDashboard();