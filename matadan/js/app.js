// app.js
let currentLang = 'en';
let currentPage = 'home';
let currentStep = 0;
const totalSteps = 5;

/**
 * Switches the visible page section and updates navigation state.
 * @param {string} pageId - The ID of the page section to display.
 */
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('page-active');
  });

  // Show target page with fade
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('page-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update mobile tab active state
  document.querySelectorAll('.mobile-tabs button').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTab = document.querySelector(`.mobile-tabs button[data-page="${pageId}"]`);
  if (activeTab) activeTab.classList.add('active');

  // Update desktop nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');

  currentPage = pageId;

  // Trigger scroll animations for new page
  setTimeout(() => {
    document.querySelectorAll(`#${pageId} .animate-on-scroll`).forEach(el => {
      el.classList.add('visible');
    });
  }, 100);
}

/**
 * Switches the app language and re-renders all i18n text.
 * @param {string} lang - Language code ('en', 'hi', or 'kn').
 */
function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (LANG[lang] && LANG[lang][key]) {
      el.textContent = LANG[lang][key];
    }
  });
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  if (typeof renderPreloadedQuestions === 'function') {
    renderPreloadedQuestions();
  }
  // Update chatbot label language
  const label = document.getElementById('chatFabLabel');
  if (label) {
    const labels = {
      en: 'Chat with me for help!',
      hi: 'सहायता के लिए चैट करें!',
      kn: 'ಸಹಾಯಕ್ಕಾಗಿ ಚಾಟ್ ಮಾಡಿ!'
    };
    label.textContent = labels[lang] || labels.en;
  }
}

// READY TO VOTE FLOW
function handleReadyYes() {
  document.getElementById('ready-step1').style.display = 'none';
  document.getElementById('ready-success').style.display = 'block';
}

function handleReadyNo() {
  document.getElementById('ready-step1').style.display = 'none';
  document.getElementById('ready-no-epic').style.display = 'block';
}

function resetReady() {
  document.getElementById('ready-step1').style.display = 'block';
  document.getElementById('ready-success').style.display = 'none';
  document.getElementById('ready-no-epic').style.display = 'none';
}

/**
 * Toggles the expansion state of a form-card accordion.
 * Only one card can be expanded at a time.
 * @param {HTMLElement} element - The clicked header element inside the form-card.
 */
function toggleForm(element) {
  const card = element.closest('.form-card');
  const isExpanded = card.classList.contains('expanded');
  document.querySelectorAll('.form-card').forEach(c => {
    c.classList.remove('expanded');
  });
  if (!isExpanded) {
    card.classList.add('expanded');
  }
}

/**
 * Updates the stepper UI — slide position, progress bar, dot states, and button labels.
 */
function updateStepper() {
  const wrapper = document.getElementById('stepperWrapper');
  if (wrapper) wrapper.style.transform = `translateX(-${currentStep * 100}%)`;
  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
  const dots = document.querySelectorAll('.step-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i < currentStep) dot.classList.add('completed');
    else if (i === currentStep) dot.classList.add('active');
  });
  const backBtn = document.getElementById('backStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  if (backBtn) backBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
  if (nextBtn) nextBtn.textContent = currentStep === totalSteps - 1 ? '✅ All Done!' : 'Next Step →';
}

// RIPPLE EFFECT
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.ripple');
  if (!btn) return;
  const circle = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  circle.className = 'ripple-effect';
  circle.style.left = `${e.clientX - rect.left}px`;
  circle.style.top = `${e.clientY - rect.top}px`;
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
});

// INIT
document.addEventListener('DOMContentLoaded', () => {
  // Show home page first
  showPage('home');
  setLanguage('en');

  // Stepper next button
  document.getElementById('nextStepBtn')?.addEventListener('click', () => {
    if (currentStep < totalSteps - 1) {
      currentStep++;
      updateStepper();
    }
  });

  // Stepper back button
  document.getElementById('backStepBtn')?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateStepper();
    }
  });

  updateStepper();
});
/**
 * Triggers the EVM → VVPAT paper slip demo animation.
 * Shows a simulated VVPAT slip for 7 seconds with a countdown bar.
 */
function triggerVVPAT() {
  const slip = document.getElementById('vvpatDemo');
  const bar = document.getElementById('vvpatBar');
  if (!slip || !bar) return;
  slip.classList.remove('show');
  bar.classList.remove('counting');
  bar.style.width = '100%';
  void slip.offsetWidth;
  slip.classList.add('show');
  setTimeout(() => { bar.classList.add('counting'); }, 900);
  setTimeout(() => {
    slip.classList.remove('show');
    bar.style.width = '100%';
    bar.classList.remove('counting');
  }, 9000);
}
