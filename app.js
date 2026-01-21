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
const stars = document.querySelectorAll('.star-rating i'); 

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// HELPER: Get the currently selected day index from the Universal Selector
function getSelectedDayIndex() {
  const selector = document.getElementById('global-day-select');
  return selector ? parseInt(selector.value) : 6; // Default to Sunday
}

// FIX: Event listener for the day dropdown to update everything immediately
const globalDaySelect = document.getElementById('global-day-select');
if (globalDaySelect) {
  globalDaySelect.addEventListener('change', () => {
    updateDashboard();
    updateHydrationUI(); 
  });
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
  
  if (id === 'insights') {
    calculateInsights();
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
  hydrationGoal: 8,
  bodyHistory: [],
  // We added arrays to track BMI and Weight per day
  weeklyWeight: [0, 0, 0, 0, 0, 0, 0],
  weeklyBMI: [null, null, null, null, null, null, null],
  lastSleep: null,
  sleepHistory: [],
  lastStress: null,
  stressHistory: [],
  totalCost: 0,
  selectedRating: 0,
  weeklyHydration: [0, 0, 0, 0, 0, 0, 0],
  weeklySleep: [0, 0, 0, 0, 0, 0, 0],
  weeklyStress: [null, null, null, null, null, null, null],
  purchaseHistory: [] // Tracked purchases
};

function timeNow() {
  return new Date().toLocaleString();
}

// --- INSIGHTS LOGIC ---
function calculateInsights() {
  const averagesDisplay = document.getElementById('insights-averages-display');
  
  const waterCard = document.getElementById('insight-card-water');
  const sleepCard = document.getElementById('insight-card-sleep');
  const stressCard = document.getElementById('insight-card-stress');
  const bmiCard = document.getElementById('insight-card-bmi');

  // 1. DATA CALCULATIONS
  const hydrationDays = state.weeklyHydration.filter(val => val > 0);
  const sleepDays = state.weeklySleep.filter(val => val > 0);

  const avgWater = hydrationDays.length > 0 ? (hydrationDays.reduce((a, b) => a + b, 0) / hydrationDays.length) : 0;
  const avgSleep = sleepDays.length > 0 ? (sleepDays.reduce((a, b) => a + b, 0) / sleepDays.length) : 0;

  // 2. WATER LOGIC
  let waterStatus = "No Data", waterColor = "#94a3b8";
  if (hydrationDays.length > 0) {
    if (avgWater >= 8) { waterStatus = "Excellent"; waterColor = "#22c55e"; }
    else if (avgWater >= 5) { waterStatus = "Average"; waterColor = "#f59e0b"; }
    else { waterStatus = "Poor"; waterColor = "#ef4444"; }
  }
  if(waterCard) {
    waterCard.style.borderTop = `4px solid ${waterColor}`;
    waterCard.querySelector('h2').textContent = waterStatus;
    waterCard.querySelector('h2').style.color = waterColor;
    waterCard.querySelector('p').textContent = `Avg: ${avgWater.toFixed(1)} cups/day`;
  }

  // 3. SLEEP LOGIC
  let sleepColor = "#94a3b8";
  if (sleepDays.length > 0) {
    sleepColor = avgSleep >= 7 ? "#a63bff" : (avgSleep >= 5 ? "#f59e0b" : "#ef4444");
  }
  if(sleepCard) {
    sleepCard.style.borderTop = `4px solid ${sleepColor}`;
    sleepCard.querySelector('h2').textContent = `${avgSleep.toFixed(1)} h`;
    sleepCard.querySelector('p').textContent = `Logged over ${sleepDays.length} days`;
  }

  // 4. STRESS LOGIC (With Appreciative/Suggestive Messages)
  let stressVal = "N/A", stressColor = "#94a3b8", stressMessage = "Log your stress to see advice.";
  if (state.stressHistory.length > 0) {
    stressVal = state.stressHistory[state.stressHistory.length - 1].level;
    if (stressVal === "Low") {
        stressColor = "#22c55e";
        stressMessage = "Excellent! You're keeping your cool. Keep this positive energy going!";
    } else if (stressVal === "Medium") {
        stressColor = "#f59e0b";
        stressMessage = "Feeling a bit tight? Consider a 5-minute stretch or some music.";
    } else if (stressVal === "High") {
        stressColor = "#ef4444";
        stressMessage = "High pressure detected. Please take a moment to breathe and rest.";
    }
  }
  if(stressCard) {
    stressCard.style.borderTop = `4px solid ${stressColor}`;
    stressCard.querySelector('h2').textContent = stressVal;
    stressCard.querySelector('h2').style.color = stressColor;
  }

  // 5. BMI LOGIC (Fixed to show Current Day BMI)
  const dayIdx = getSelectedDayIndex();
  const currentBMI = state.weeklyBMI[dayIdx];
  if(bmiCard) {
    if(currentBMI) {
        const cat = bmiCategory(currentBMI);
        bmiCard.style.borderTop = `4px solid #22c55e`;
        bmiCard.querySelector('h2').textContent = cat;
        bmiCard.querySelector('p').textContent = `Current BMI: ${currentBMI}`;
    } else {
        bmiCard.style.borderTop = `4px solid #94a3b8`;
        bmiCard.querySelector('h2').textContent = "--";
        bmiCard.querySelector('p').textContent = "No data for today";
    }
  }

  // 6. DETAILED RECOMMENDATIONS
  if(averagesDisplay) {
    averagesDisplay.innerHTML = `
      <div class="insight-item">
        <p>• <strong>Stress Mindset:</strong> ${stressMessage}</p>
        <p>• <strong>Water Habit:</strong> ${avgWater >= 8 ? "Perfect hydration!" : "Aim for " + (8 - avgWater).toFixed(1) + " more cups daily."}</p>
        <p>• <strong>Sleep Health:</strong> ${avgSleep >= 7 ? "Great recovery!" : "Try to add 1-2 hours of sleep tonight."}</p>
      </div>
    `;
  }
}

function updateDashboard() {
  const dayIdx = getSelectedDayIndex();
  const dashWater = document.getElementById('dash-water');
  const dashSleep = document.getElementById('dash-sleep');
  const dashBmi = document.getElementById('dash-bmi');
  const dashStress = document.getElementById('dash-stress');

  if (dashWater) dashWater.textContent = `${state.weeklyHydration[dayIdx]} / ${state.hydrationGoal} cups`;
  
  const currentSleep = state.weeklySleep[dayIdx];
  if (dashSleep) dashSleep.textContent = currentSleep > 0 ? `${currentSleep} h` : '0 h';
  
  // BMI Display Fixed for the selected day
  const dayBMI = state.weeklyBMI[dayIdx];
  if (dashBmi) dashBmi.textContent = dayBMI ? `BMI: ${dayBMI}` : 'BMI: –';
  
  const currentStress = state.weeklyStress[dayIdx];
  if (dashStress) dashStress.textContent = currentStress ? currentStress : 'Not logged';
}

// --- PRICING & SERVICES LOGIC ---
const planButtons = document.querySelectorAll('.product-btn');
const purchaseListContainer = document.getElementById('purchase-list-container');

function addPurchaseEntry(name, price) {
  const entry = { name, price, at: timeNow() };
  state.purchaseHistory.push(entry);

  if (purchaseListContainer && purchaseListContainer.classList.contains('empty-note')) {
    purchaseListContainer.classList.remove('empty-note');
    purchaseListContainer.textContent = '';
  }

  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div>
      <div class="entry-main">${name} Plan</div>
      <div class="entry-meta">Price: $${price} • ${entry.at}</div>
    </div>
    <div style="color: #22c55e; font-weight: bold;">Active</div>
  `;
  if (purchaseListContainer) purchaseListContainer.prepend(div);
}

planButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const price = btn.dataset.price;
    const planName = btn.dataset.name;
    state.totalCost = price;

    addPurchaseEntry(planName, price);

    if (price === "0") {
      alert(`7-Day Trial Activated! You now have temporary access to a Health Consultant.`);
    } else {
      alert(`Thank you for choosing the ${planName}! Monthly total: $${price}.`);
    }
    
    showPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// --- HYDRATION LOGIC ---
const hydrationForm = document.getElementById('hydration-form');
const hydrationInput = document.getElementById('hydration-input');
const hydrationSummary = document.getElementById('hydration-summary');
const hydrationBar = document.getElementById('hydration-bar');
const hydrationList = document.getElementById('hydration-list');

function updateHydrationUI() {
  const dayIdx = getSelectedDayIndex();
  const currentVal = state.weeklyHydration[dayIdx];
  
  if (hydrationSummary) hydrationSummary.textContent = `${currentVal} / ${state.hydrationGoal} cups`;
  const percent = Math.min(100, (currentVal / state.hydrationGoal) * 100);
  if (hydrationBar) hydrationBar.style.width = percent + '%';
  updateDashboard();
}

function addHydrationEntry(amount) {
  const dayIdx = getSelectedDayIndex();
  state.weeklyHydration[dayIdx] = +(state.weeklyHydration[dayIdx] + amount).toFixed(2);
  
  wellnessChart.data.datasets[0].data[dayIdx] = state.weeklyHydration[dayIdx];
  wellnessChart.update();

  if (hydrationList && hydrationList.classList.contains('empty-note')) {
    hydrationList.classList.remove('empty-note');
    hydrationList.textContent = '';
  }
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `<div><div class="entry-main">+${amount} cups (${daysOfWeek[dayIdx]})</div><div class="entry-meta">${timeNow()}</div></div>`;
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

// --- BODY METRICS ---
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
  const dayIdx = getSelectedDayIndex();
  
  // Update state for the specific day
  state.weeklyWeight[dayIdx] = weight;
  state.weeklyBMI[dayIdx] = bmi;
  state.bodyHistory.push({ weight, height, bmi, at: timeNow(), day: daysOfWeek[dayIdx] });
  
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

// --- SLEEP LOGIC ---
const sleepForm = document.getElementById('sleep-form');
const sleepHours = document.getElementById('sleep-hours');
const sleepQuality = document.getElementById('sleep-quality');
const sleepSummary = document.getElementById('sleep-summary');
const sleepList = document.getElementById('sleep-list');

function addSleepEntry(hours, quality) {
  const dayIdx = getSelectedDayIndex();
  const entry = { hours, quality, at: timeNow() };
  
  state.lastSleep = entry;
  state.sleepHistory.push(entry);
  state.weeklySleep[dayIdx] = hours; 

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

// --- STRESS LOGIC ---
const stressForm = document.getElementById('stress-form');
const stressLevel = document.getElementById('stress-level');
const stressNote = document.getElementById('stress-note');
const stressSummary = document.getElementById('stress-summary');
const stressList = document.getElementById('stress-list');

function addStressEntry(level, note) {
  const dayIdx = getSelectedDayIndex();
  const entry = { level, note, at: timeNow() };
  
  state.lastStress = entry;
  state.stressHistory.push(entry);
  state.weeklyStress[dayIdx] = level; 

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

// --- MODAL CONTROLS (LOGIN) ---
if (openLoginBtn) openLoginBtn.addEventListener('click', () => { loginModal.style.display = 'flex'; });
if (closeBtn) closeBtn.addEventListener('click', () => { loginModal.style.display = 'none'; });

loginFormActual.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const emailField = document.getElementById('login-email');
    const phoneField = document.getElementById('login-phone');
    const msg = document.getElementById('login-msg');
    const emailValue = emailField.value.trim().toLowerCase();
    const phoneValue = phoneField.value.trim();

    if (!emailValue.endsWith('@gmail.com') || emailValue.length <= 10) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "enter valid gmail";
        emailField.focus();
        return; 
    } 

    const indianPhonePattern = /^[6-9][0-9]{9}$/; 
    if (!indianPhonePattern.test(phoneValue)) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "enter valid mobile number";
        phoneField.focus();
        return; 
    } 

    msg.style.color = "#2ecc71";
    msg.textContent = "Verified. Syncing data...";
    
    setTimeout(() => { 
        loginModal.style.display = 'none'; 
        loginFormActual.reset(); 
        msg.textContent = ""; 
    }, 1500);
});

// --- MODAL CONTROLS (FEEDBACK) ---
if (openFeedbackBtn) openFeedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'flex'; });
if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'none'; });

stars.forEach(star => {
  star.addEventListener('mouseover', () => highlightStars(star.dataset.value));
  star.addEventListener('mouseout', () => highlightStars(state.selectedRating));
  star.addEventListener('click', () => {
    state.selectedRating = star.dataset.value;
    highlightStars(state.selectedRating);
  });
});

function highlightStars(count) {
  stars.forEach(s => {
    s.classList.toggle('active', s.dataset.value <= count);
  });
}

window.addEventListener('click', (e) => { 
    if (e.target === feedbackModal) feedbackModal.style.display = 'none'; 
    if (e.target === loginModal) loginModal.style.display = 'none';
});

feedbackFormActual.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('feedback-msg');
    
    if (state.selectedRating === 0) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "Please select a star rating.";
        return;
    }

    msg.style.color = "#2ecc71";
    msg.textContent = `Thank you for the ${state.selectedRating}-star feedback!`;
    
    setTimeout(() => { 
        feedbackModal.style.display = 'none'; 
        feedbackFormActual.reset(); 
        state.selectedRating = 0;
        highlightStars(0);
        msg.textContent = ""; 
    }, 1500);
});

// --- CHART INITIALIZATION ---
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