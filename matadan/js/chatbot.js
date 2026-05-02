// chatbot.js

let chatPopupInterval;
let isChatOpen = false;
let geminiHistory = [];

let chatExpanded = false;

/** Toggles the chat drawer open/closed and manages expanded state. */
function toggleChat() {
  const drawer = document.getElementById('chatDrawer');
  const label = document.querySelector('.chat-fab-label');
  
  isChatOpen = !isChatOpen;
  
  if (isChatOpen) {
    drawer.classList.add('open');
    label.classList.remove('show');
    clearInterval(chatPopupInterval);
    const msgs = document.getElementById('chatMessages');
    if (msgs.children.length === 0) {
      const welcome = (LANG[currentLang] && LANG[currentLang].chat_welcome) 
        ? LANG[currentLang].chat_welcome 
        : 'Namaste! I am Matadan AI. How can I help you with your election queries today?';
      appendMessage('bot', welcome);
      renderPreloadedQuestions();
    }
  } else {
    drawer.classList.remove('open');
    if (chatExpanded) {
      chatExpanded = false;
      drawer.style.width = '';
      drawer.style.height = '';
      drawer.style.bottom = '';
    }
  }
}

/** Toggles the chat drawer between normal and expanded (480px) mode. */
function expandChat() {
  const drawer = document.getElementById('chatDrawer');
  const btn = document.getElementById('expandChatBtn');
  chatExpanded = !chatExpanded;
  if (chatExpanded) {
    drawer.style.width = '480px';
    drawer.style.height = '70vh';
    drawer.style.bottom = '100px';
    btn.textContent = '⊟';
    btn.title = 'Collapse';
  } else {
    drawer.style.width = '';
    drawer.style.height = '';
    drawer.style.bottom = '';
    btn.textContent = '⛶';
    btn.title = 'Expand';
  }
}

function initChatbotPopups() {
  // Start the 8-12s popup timer
  scheduleNextPopup();
}

function scheduleNextPopup() {
  if (isChatOpen) return;
  const delay = Math.floor(Math.random() * 4000 + 8000);
  chatPopupInterval = setTimeout(() => {
    if (!isChatOpen) {
      const label = document.getElementById('chatFabLabel');
      if (!label) return;
      const labels = {
        en: 'Chat with me for help!',
        hi: 'सहायता के लिए चैट करें!',
        kn: 'ಸಹಾಯಕ್ಕಾಗಿ ಚಾಟ್ ಮಾಡಿ!'
      };
      label.textContent = labels[currentLang] || labels.en;
      label.classList.add('show');
      setTimeout(() => {
        label.classList.remove('show');
        scheduleNextPopup();
      }, 3500);
    }
  }, delay);
}

/**
 * Appends a sanitized message bubble to the chat log.
 * Escapes HTML to prevent XSS, then selectively allows **bold** markdown.
 * @param {'user'|'bot'} sender - Who sent the message.
 * @param {string} text - The message content (may contain **bold** markdown).
 */
function appendMessage(sender, text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  
  // Sanitize: escape HTML first, then selectively allow **bold** markdown
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.innerHTML = formatted;
  
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Sends the user's message to Gemini 2.0 Flash or falls back to keyword matching.
 * Maintains conversation history for multi-turn context.
 */
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  
  // Append user message
  appendMessage('user', text);
  input.value = '';
  
  // Add to history
  geminiHistory.push({
      role: "user",
      parts: [{ text: text }]
  });
  
  showTyping();
  
  try {
      // Check if offline first — skip API call entirely
      if (!navigator.onLine || !ENV.GEMINI_KEY || ENV.GEMINI_KEY === 'YOUR_GEMINI_API_KEY') {
          setTimeout(() => {
              hideTyping();
              const response = getFallbackResponse(text);
              appendMessage('bot', response);
              geminiHistory.push({ role: "model", parts: [{ text: response }] });
          }, 800); // Small delay to feel natural
          return;
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ENV.GEMINI_KEY}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              contents: geminiHistory,
              systemInstruction: {
                  parts: [{ text: "You are Matadan AI, an expert assistant on the Indian Election Process. You provide concise, accurate, and helpful answers regarding voter registration, polling booths, EVMs, and the Model Code of Conduct. Be polite, authoritative, and accessible. Use short sentences. Use bolding for emphasis." }]
              }
          })
      });
      
      const data = await response.json();
      hideTyping();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
          const botReply = data.candidates[0].content.parts[0].text;
          appendMessage('bot', botReply);
          
          geminiHistory.push({
              role: "model",
              parts: [{ text: botReply }]
          });
      } else {
          appendMessage('bot', getFallbackResponse(text));
      }
      
  } catch (error) {
      hideTyping();
      console.error('Chat error:', error);
      appendMessage('bot', getFallbackResponse(text));
  }
}

/**
 * Provides an offline fallback response by keyword-matching against preloaded Q&A.
 * @param {string} query - The user's question.
 * @returns {string} A helpful response or redirect to helpline.
 */
function getFallbackResponse(query) {
    const q = query.toLowerCase();
    const langData = LANG[currentLang] || LANG['en'];
    const data = langData.chat_preloaded;

    // Try preloaded data first
    if (data && Array.isArray(data)) {
        for (let item of data) {
            const keywords = item.q.toLowerCase().split(' ').filter(w => w.length > 3);
            if (keywords.some(kw => q.includes(kw))) {
                return item.a;
            }
        }
    }

    // Extended keyword matching for common queries
    if (q.includes('form 6') || (q.includes('new') && q.includes('voter'))) {
        return "**Form 6** is for first-time Indian voters (18+). Fill it at **voters.eci.gov.in**. You need: Age proof + Address proof + Photo. It's completely free and takes 10-15 minutes online.";
    }
    if (q.includes('nri') || q.includes('abroad') || q.includes('form 6a')) {
        return "**NRI voters** use **Form 6A**. You need a valid Indian Passport. Fill it at voters.eci.gov.in. You can vote at your Indian constituency when you visit India.";
    }
    if (q.includes('document') || q.includes('id') || q.includes('bring')) {
        return "**At the polling booth, bring any ONE of these:**\n✅ Voter ID (EPIC)\n✅ Aadhaar Card\n✅ Passport\n✅ Driving License\n✅ PAN Card\n✅ MNREGA Job Card\n✅ Bank Passbook with Photo\n\nTotal: 12 ECI-approved documents accepted.";
    }
    if (q.includes('booth') || q.includes('polling') || q.includes('station')) {
        return "**Find your polling booth:**\n🌐 Visit electoralsearch.eci.gov.in\n📞 Call 1950 (free helpline)\n📱 Use the 'Find My Booth' section in this app\n\nYour booth is assigned based on your registered address.";
    }
    if (q.includes('evm') || q.includes('machine') || (q.includes('vote') && q.includes('how'))) {
        return "**How to vote on EVM:**\n1️⃣ Enter the booth and give your name\n2️⃣ Get ink on your left index finger\n3️⃣ Press the blue button next to your candidate\n4️⃣ Hear a beep = vote confirmed ✅\n5️⃣ VVPAT shows paper slip for 7 seconds\n\nNOTA is always the last button if you want to reject all candidates.";
    }
    if (q.includes('nota')) {
        return "**NOTA (None of the Above)** is the last button on every EVM. Introduced by Supreme Court in 2013. Your vote still counts as democratic participation. It cannot directly cause re-election but sends a strong message.";
    }
    if (q.includes('1950') || q.includes('helpline') || q.includes('help')) {
        return "**Voter Helpline: 1950** (free call, multilingual, 24/7 during elections)\n\nFor violations: Use **cVIGIL app** — upload evidence, officials respond within 100 minutes.";
    }
    if (q.includes('hostel') || q.includes('student') || q.includes('another city')) {
        return "**Students in hostels:** You can register at your hostel address (Form 6) OR your home address. You can only vote where you are registered. Cannot vote in both places. Choose whichever is easier to reach on election day.";
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
        return "Namaste! I am Matadan AI 🤖\n\nI can help you with:\n📋 Voter registration & forms\n🪪 Documents needed to vote\n📍 Finding your polling booth\n🗳️ How the EVM works\n🚨 Reporting violations\n\nWhat would you like to know?";
    }

    return "**Great question!** For accurate and up-to-date information:\n📞 Call **1950** (free Voter Helpline)\n🌐 Visit **voters.eci.gov.in**\n\nYou can also try one of the preloaded questions below — they work fully offline! 👇";
}

/**
 * Handles preloaded question button clicks.
 * Directly returns the curated preloaded answer — never sends to Gemini.
 * This ensures correct answers, saves API quota, and is instant.
 * @param {string} text - The preloaded question text.
 */
function sendPreloadedQuestion(text) {
    appendMessage('user', text);
    showTyping();
    
    // Find the exact preloaded answer
    const langData = LANG[currentLang] || LANG['en'];
    const data = langData.chat_preloaded;
    let answer = null;
    
    if (data && Array.isArray(data)) {
        const match = data.find(item => item.q === text);
        if (match) answer = match.a;
    }
    
    setTimeout(() => {
        hideTyping();
        appendMessage('bot', answer || getFallbackResponse(text));
    }, 600);
}

function renderPreloadedQuestions() {
    const container = document.getElementById('preloadedQuestionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const langData = LANG[currentLang] || LANG['en'];
    const questions = langData.chat_preloaded;
    if (!questions || !Array.isArray(questions)) return;
    
    questions.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'preloaded-btn ripple';
        btn.textContent = q.q;
        btn.onclick = () => sendPreloadedQuestion(q.q);
        container.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Input enter key support
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    setTimeout(initChatbotPopups, 2000);
    renderPreloadedQuestions();
});

// ── VOICE INPUT (Speech Recognition) ────────────────────────────

let recognition = null;
let isListening = false;

const VOICE_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN'
};

function toggleVoiceInput() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    if (typeof showToast === 'function') showToast('Voice input not supported in this browser. Try Chrome.');
    return;
  }
  if (isListening) { stopVoiceInput(); return; }
  startVoiceInput();
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = VOICE_LANG_MAP[currentLang] || 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  const micBtn = document.getElementById('micBtn');
  const chatInput = document.getElementById('chatInput');
  const msgs = document.getElementById('chatMessages');

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.innerHTML = '🔴';
    micBtn.title = 'Tap to stop';
    const wave = document.createElement('div');
    wave.className = 'voice-wave';
    wave.id = 'voiceWave';
    wave.innerHTML = '<span></span><span></span><span></span><span></span><span></span>';
    msgs.appendChild(wave);
    msgs.scrollTop = msgs.scrollHeight;
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
    chatInput.value = transcript;
  };

  recognition.onend = () => {
    stopVoiceInput();
    const text = chatInput.value.trim();
    if (text) setTimeout(() => sendChatMessage(), 300);
  };

  recognition.onerror = (event) => {
    stopVoiceInput();
    if (event.error === 'not-allowed') {
      if (typeof showToast === 'function') showToast('❌ Microphone permission denied. Please allow mic access.');
    } else if (event.error === 'no-speech') {
      if (typeof showToast === 'function') showToast('No speech detected. Please try again.');
    } else {
      if (typeof showToast === 'function') showToast('Voice error: ' + event.error);
    }
  };

  recognition.start();
}

function stopVoiceInput() {
  isListening = false;
  const micBtn = document.getElementById('micBtn');
  if (micBtn) {
    micBtn.classList.remove('listening');
    micBtn.innerHTML = '🎤';
    micBtn.title = 'Speak your question';
  }
  const wave = document.getElementById('voiceWave');
  if (wave) wave.remove();
  if (recognition) {
    try { recognition.stop(); } catch(e) {}
    recognition = null;
  }
}

// ── TEXT TO SPEECH (Read Answer Aloud) ──────────────────────────

let currentUtterance = null;

function speakText(text, buttonEl) {
  if (!('speechSynthesis' in window)) {
    if (typeof showToast === 'function') showToast('Text-to-speech not supported in this browser.');
    return;
  }
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    document.querySelectorAll('.tts-btn').forEach(btn => {
      btn.classList.remove('speaking');
      btn.innerHTML = '🔊 Listen';
    });
    return;
  }
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/→/g, '').trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const langMap = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
  utterance.lang = langMap[currentLang] || 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    if (buttonEl) { buttonEl.classList.add('speaking'); buttonEl.innerHTML = '⏹ Stop'; }
  };
  utterance.onend = () => {
    currentUtterance = null;
    if (buttonEl) { buttonEl.classList.remove('speaking'); buttonEl.innerHTML = '🔊 Listen'; }
  };
  utterance.onerror = () => {
    currentUtterance = null;
    if (buttonEl) { buttonEl.classList.remove('speaking'); buttonEl.innerHTML = '🔊 Listen'; }
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// ── OVERRIDE appendMessage to add TTS button on bot replies ──────

window.appendMessage = function(sender, text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  // XSS safety: only allow safe tags we just created
  div.innerHTML = formatted;
  if (sender === 'bot') {
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn';
    ttsBtn.innerHTML = '🔊 Listen';
    ttsBtn.setAttribute('aria-label', 'Listen to this answer');
    ttsBtn.onclick = function() { speakText(text, this); };
    div.appendChild(document.createElement('br'));
    div.appendChild(ttsBtn);
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
};
