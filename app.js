// --- DOM ELEMENTS ---
const navBtns = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const loginModal = document.getElementById('loginModal');
const openLoginBtn = document.getElementById('openLogin');
const closeBtn = document.querySelector('.close-btn');
const loginFormActual = document.getElementById('login-form-actual');

// NEW USER ELEMENTS
const sidebarUserArea = document.getElementById('sidebar-user-area');
const displayUserName = document.getElementById('display-user-name');
const logoutBtn = document.getElementById('logout-btn');

// NEW FEEDBACK CONSTANTS
const feedbackModal = document.getElementById('feedbackModal');
const openFeedbackBtn = document.getElementById('openFeedback');
const closeFeedbackBtn = document.querySelector('.close-feedback');
const feedbackFormActual = document.getElementById('feedback-form-actual');
const stars = document.querySelectorAll('.star-rating i'); 

// CART DOM ELEMENTS
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- STORAGE LOGIC ---
function saveData() {
  const currentUser = localStorage.getItem('wellness_user');
  if (currentUser) {
    localStorage.setItem(`data_${currentUser}`, JSON.stringify(state));
  }
}

// NEW FIX: Helper to rebuild all history lists in the UI from the 'state' object
function refreshHistoryLists() {
    // Clear all existing entries first
    if (hydrationList) hydrationList.innerHTML = '';
    if (sleepList) sleepList.innerHTML = '';
    if (stressList) stressList.innerHTML = '';
    if (bodyList) bodyList.innerHTML = '';
    if (purchaseListContainer) purchaseListContainer.innerHTML = '';

    // Re-render Hydration History
    state.hydrationHistory.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'entry';
        div.innerHTML = `<div><div class="entry-main">+${entry.amount} cups (${entry.day || 'Logged'})</div><div class="entry-meta">${entry.at}</div></div>`;
        if (hydrationList) {
            hydrationList.classList.remove('empty-note');
            hydrationList.prepend(div);
        }
    });

    // Re-render Sleep History
    state.sleepHistory.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'entry';
        item.innerHTML = `<div><div class="entry-main">${entry.hours} h (${entry.day || 'Logged'})</div><div class="entry-meta">${entry.at}</div></div>`;
        if (sleepList) {
            sleepList.classList.remove('empty-note');
            sleepList.prepend(item);
        }
    });

    // Re-render Stress History
    state.stressHistory.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'entry';
        item.innerHTML = `<div><div class="entry-main">${entry.level} (${entry.day || 'Logged'})</div><div class="entry-meta">${entry.at}${entry.note ? ' • ' + entry.note : ''}</div></div>`;
        if (stressList) {
            stressList.classList.remove('empty-note');
            stressList.prepend(item);
        }
    });

    // Re-render Body History
    state.bodyHistory.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'entry';
        item.innerHTML = `<div><div class="entry-main">${entry.weight} kg (${entry.day || 'Logged'})</div><div class="entry-meta">BMI ${entry.bmi} · ${entry.at}</div></div>`;
        if (bodyList) {
            bodyList.classList.remove('empty-note');
            bodyList.prepend(item);
        }
    });

    // Re-render Purchases
    state.purchaseHistory.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'entry';
        div.innerHTML = `<div><div class="entry-main">${entry.name} Plan</div><div class="entry-meta">Price: $${entry.price} • ${entry.at}</div></div><div style="color: #22c55e; font-weight: bold;">Active</div>`;
        if (purchaseListContainer) {
            purchaseListContainer.classList.remove('empty-note');
            purchaseListContainer.prepend(div);
        }
    });
}

function loadData() {
  const currentUser = localStorage.getItem('wellness_user');
  if (currentUser) {
    const saved = localStorage.getItem(`data_${currentUser}`);
    if (saved) {
      Object.assign(state, JSON.parse(saved));
      // Sync Chart
      wellnessChart.data.datasets[0].data = [...state.weeklyHydration];
      wellnessChart.data.datasets[2].data = [...state.weeklySleep];
      wellnessChart.data.datasets[3].data = [...state.weeklyWeight];
      
      // Update Stress Chart specifically
      const mapping = { 'Low': 2, 'Medium': 5, 'High': 8 };
      wellnessChart.data.datasets[1].data = state.weeklyStress.map(lvl => mapping[lvl] || 0);
      
      wellnessChart.update();
      refreshHistoryLists(); // SYNC UI LISTS
      refreshCartUI();       // SYNC CART
    }
  }
}

// --- USER SESSION LOGIC (NO BACKEND) ---
function updateUserUI() {
  const savedUser = localStorage.getItem('wellness_user');
  if (savedUser) {
    if (openLoginBtn) openLoginBtn.style.display = 'none';
    if (sidebarUserArea) sidebarUserArea.style.display = 'block';
    if (displayUserName) displayUserName.textContent = savedUser;
    loadData(); // Load specific user data here
    updateDashboard();
  } else {
    if (openLoginBtn) openLoginBtn.style.display = 'flex';
    if (sidebarUserArea) sidebarUserArea.style.display = 'none';
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('wellness_user');
    window.location.reload(); // Refresh to reset all states
  });
}

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
  registeredPhone: null,
  registeredPass: null, 
  hydrationGoal: 8,
  bodyHistory: [],
  weeklyWeight: [0, 0, 0, 0, 0, 0, 0],
  weeklyBMI: [null, null, null, null, null, null, null],
  lastSleep: null,
  sleepHistory: [],
  lastStress: null,
  stressHistory: [],
  totalCost: 0,
  selectedRating: 0,
  weeklyHydration: [0, 0, 0, 0, 0, 0, 0],
  hydrationHistory: [], 
  weeklySleep: [0, 0, 0, 0, 0, 0, 0],
  weeklyStress: [null, null, null, null, null, null, null],
  purchaseHistory: [],
  cart: [] // NEW: Stores current items in cart
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

  const hydrationDays = state.weeklyHydration.filter(val => val > 0);
  const sleepDays = state.weeklySleep.filter(val => val > 0);

  const avgWater = hydrationDays.length > 0 ? (hydrationDays.reduce((a, b) => a + b, 0) / hydrationDays.length) : 0;
  const avgSleep = sleepDays.length > 0 ? (sleepDays.reduce((a, b) => a + b, 0) / sleepDays.length) : 0;

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

  let sleepColor = "#94a3b8";
  if (sleepDays.length > 0) {
    sleepColor = avgSleep >= 7 ? "#a63bff" : (avgSleep >= 5 ? "#f59e0b" : "#ef4444");
  }
  if(sleepCard) {
    sleepCard.style.borderTop = `4px solid ${sleepColor}`;
    sleepCard.querySelector('h2').textContent = `${avgSleep.toFixed(1)} h`;
    sleepCard.querySelector('p').textContent = `Logged over ${sleepDays.length} days`;
  }

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
  
  const dayBMI = state.weeklyBMI[dayIdx];
  if (dashBmi) dashBmi.textContent = dayBMI ? `BMI: ${dayBMI}` : 'BMI: –';
  
  const currentStress = state.weeklyStress[dayIdx];
  if (dashStress) dashStress.textContent = currentStress ? currentStress : 'Not logged';
}

// --- CART & PRICING LOGIC ---
const planButtons = document.querySelectorAll('.product-btn');
const purchaseListContainer = document.getElementById('purchase-list-container');

function refreshCartUI() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    let total = 0;

    if (state.cart.length === 0) {
        cartItemsList.innerHTML = '<p class="empty-note">Click a service above to add to your cart.</p>';
    } else {
        state.cart.forEach((item, index) => {
            total += parseInt(item.price);
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `
                <div>
                    <div class="entry-main">${item.name}</div>
                    <div class="entry-meta">$${item.price}</div>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>`;
            cartItemsList.appendChild(div);
        });
    }
    cartTotalPrice.textContent = total;
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    saveData();
    refreshCartUI();
}

planButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const price = btn.dataset.price;
    const planName = btn.dataset.name;
    
    // Add to state cart
    state.cart.push({ name: planName, price: price });
    saveData();
    refreshCartUI();
    
    // Feedback
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
    setTimeout(() => { btn.innerHTML = btn.dataset.price === "0" ? 'Start 7-Day Trial' : (btn.dataset.price === "39" ? 'Get Started' : 'Select Plan'); }, 1000);
  });
});

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        // Move items from cart to purchase history
        state.cart.forEach(item => {
            state.purchaseHistory.push({
                name: item.name,
                price: item.price,
                at: timeNow()
            });
        });

        const finalTotal = cartTotalPrice.textContent;
        state.cart = []; // Clear cart
        saveData();
        refreshCartUI();
        refreshHistoryLists();

        alert(`Purchase Confirmed! Total charged: $${finalTotal}. Your services are now active.`);
        showPage('dashboard');
    });
}

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
  
  state.hydrationHistory.push({ amount, day: daysOfWeek[dayIdx], at: timeNow() });

  wellnessChart.data.datasets[0].data[dayIdx] = state.weeklyHydration[dayIdx];
  wellnessChart.update();
  saveData();
  refreshHistoryLists(); // SYNC UI
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
  state.weeklyWeight[dayIdx] = weight;
  state.weeklyBMI[dayIdx] = bmi;
  state.bodyHistory.push({ weight, height, bmi, at: timeNow(), day: daysOfWeek[dayIdx] });
  
  wellnessChart.data.datasets[3].data[dayIdx] = weight;
  wellnessChart.update();
  saveData();

  if (bmiResult) bmiResult.textContent = `BMI: ${bmi} (${bmiCategory(bmi)})`;
  refreshHistoryLists(); // SYNC UI
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
  const entry = { hours, quality, day: daysOfWeek[dayIdx], at: timeNow() };
  
  state.lastSleep = entry;
  state.sleepHistory.push(entry);
  state.weeklySleep[dayIdx] = hours; 

  wellnessChart.data.datasets[2].data[dayIdx] = hours;
  wellnessChart.update();
  saveData();

  if (sleepSummary) sleepSummary.textContent = `${hours} h (${quality})`;
  refreshHistoryLists(); // SYNC UI
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
  const entry = { level, note, day: daysOfWeek[dayIdx], at: timeNow() };
  
  state.lastStress = entry;
  state.stressHistory.push(entry);
  state.weeklyStress[dayIdx] = level; 

  const stressMapping = { 'Low': 2, 'Medium': 5, 'High': 8 }; 
  wellnessChart.data.datasets[1].data[dayIdx] = stressMapping[level] || 0;
  wellnessChart.update();
  saveData();

  if (stressSummary) stressSummary.textContent = level;
  refreshHistoryLists(); // SYNC UI
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
    const passField = document.getElementById('login-password'); 
    const msg = document.getElementById('login-msg');
    
    const emailValue = emailField.value.trim().toLowerCase();
    const phoneValue = phoneField.value.trim();
    const passValue = passField ? passField.value.trim() : "";

    // VALIDATIONS
    if (!emailValue.endsWith('@gmail.com') || emailValue.length <= 10) {
        msg.style.color = "#ff4d4d"; msg.textContent = "enter valid gmail";
        emailField.focus(); return; 
    } 
    const indianPhonePattern = /^[6-9][0-9]{9}$/; 
    if (!indianPhonePattern.test(phoneValue)) {
        msg.style.color = "#ff4d4d"; msg.textContent = "enter valid mobile number";
        phoneField.focus(); return; 
    } 
    
    if (passValue.length === 0) {
        msg.style.color = "#ff4d4d"; msg.textContent = "password required";
        return;
    }

    const userName = emailValue.split('@')[0];
    
    // DATA VERIFICATION
    const existingData = localStorage.getItem(`data_${userName}`);
    if (existingData) {
        const parsedData = JSON.parse(existingData);
        if (parsedData.registeredPhone && parsedData.registeredPhone !== phoneValue) {
            msg.style.color = "#ff4d4d"; msg.textContent = "mobile number does not match account!";
            return;
        }
        if (parsedData.registeredPass && parsedData.registeredPass !== passValue) {
            msg.style.color = "#ff4d4d"; msg.textContent = "incorrect password!";
            return;
        }
    } else {
        state.registeredPhone = null;
        state.registeredPass = null;
        state.cart = []; // Reset cart for new user
    }

    // SUCCESS
    localStorage.setItem('wellness_user', userName);
    if (!state.registeredPhone) state.registeredPhone = phoneValue;
    if (!state.registeredPass) state.registeredPass = passValue;

    msg.style.color = "#2ecc71";
    msg.textContent = "Verified. Syncing data...";
    
    setTimeout(() => { 
        loginModal.style.display = 'none'; 
        loginFormActual.reset(); 
        msg.textContent = ""; 
        updateUserUI(); 
        saveData();
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
            { label: 'Water', type: 'bar', data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(37, 99, 235, 0.6)' },
            { label: 'Stress', type: 'line', data: [0,0,0,0,0,0,0], borderColor: '#ec4899' },
            { label: 'Sleep', type: 'bar', data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(166, 59, 255, 0.6)' },
            { label: 'Weight', type: 'line', data: [0,0,0,0,0,0,0], borderColor: '#22c55e' }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// --- INITIALIZE PAGE ---
updateDashboard();
updateUserUI();