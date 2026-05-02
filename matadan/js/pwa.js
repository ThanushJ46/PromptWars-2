// pwa.js — PWA Install Prompt + Offline Detection for Matadan

let deferredInstallPrompt = null;
let isOnline = navigator.onLine;

// ── INSTALL PROMPT ──────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    setTimeout(() => {
      banner.style.display = 'flex';
      banner.classList.add('pwa-banner-show');
    }, 3000);
  }
}

function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      hidePWABanner();
      showToast('✅ Matadan installed! Works offline now.');
    }
    deferredInstallPrompt = null;
  });
}

function hidePWABanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    banner.classList.remove('pwa-banner-show');
    setTimeout(() => banner.style.display = 'none', 300);
  }
}

window.addEventListener('appinstalled', () => {
  showToast('🎉 Matadan installed successfully!');
  hidePWABanner();
});

// ── OFFLINE / ONLINE DETECTION ──────────────────────────────────
window.addEventListener('online', () => {
  isOnline = true;
  hideOfflineBanner();
  showToast('✅ Back online! Full features restored.');
  const sendBtn = document.querySelector('.chat-input-area .btn-primary');
  if (sendBtn) {
    sendBtn.style.opacity = '1';
    sendBtn.title = 'Send message';
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  showOfflineBanner();
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.placeholder = 'Offline mode — preloaded answers available';
  }
  const sendBtn = document.querySelector('.chat-input-area .btn-primary');
  if (sendBtn) {
    sendBtn.title = 'Offline — using preloaded answers';
  }
});

function showOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (banner) {
    banner.style.display = 'flex';
    banner.classList.add('offline-banner-show');
  }
}

function hideOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (banner) {
    banner.classList.remove('offline-banner-show');
    setTimeout(() => banner.style.display = 'none', 300);
  }
}

// ── TOAST NOTIFICATIONS ─────────────────────────────────────────
function showToast(message, duration = 3000) {
  const existing = document.getElementById('pwaToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'pwaToast';
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: var(--navy); color: white; padding: 0.75rem 1.5rem;
    border-radius: 24px; font-size: 0.875rem; font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;
    animation: toastIn 300ms ease forwards;
    white-space: nowrap;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 300ms ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── SERVICE WORKER REGISTRATION ─────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Matadan SW registered:', reg.scope);
        setInterval(() => reg.update(), 60000);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 Update available! Refresh to get the latest version.');
            }
          });
        });
      })
      .catch(err => console.log('Matadan SW registration failed:', err));
  });
}

// ── HANDLE URL SHORTCUTS ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page');
  if (page && typeof showPage === 'function') {
    setTimeout(() => showPage(page), 100);
  }
  if (!navigator.onLine) {
    showOfflineBanner();
  }
});

// ── TOAST ANIMATION STYLES ──────────────────────────────────────
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }
  .pwa-banner-show { animation: slideUp 300ms ease forwards; }
  .offline-banner-show { animation: slideDown 300ms ease forwards; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
document.head.appendChild(toastStyles);
