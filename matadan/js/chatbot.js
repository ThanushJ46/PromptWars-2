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
      if (!ENV.GEMINI_KEY || ENV.GEMINI_KEY === 'YOUR_GEMINI_API_KEY') {
          // Fallback if API key not set - use preloaded data search
          setTimeout(() => {
              hideTyping();
              const response = getFallbackResponse(text);
              appendMessage('bot', response);
          }, 1000);
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
    const q = query.toLowerCase().trim();
    const langData = LANG[currentLang] || LANG['en'];
    const data = langData.chat_preloaded;
    
    if (!data || !Array.isArray(data)) {
        return "I'm currently running in offline mode. Please try the preloaded questions below.";
    }
    
    // 1. Exact match first (handles preloaded button clicks)
    for (let item of data) {
        if (item.q.toLowerCase().trim() === q) {
            return item.a;
        }
    }
    
    // 2. Score-based matching — pick the answer with the most keyword hits
    let bestMatch = null;
    let bestScore = 0;
    
    for (let item of data) {
        const keywords = item.q.toLowerCase().split(/[\s—,?]+/).filter(w => w.length > 3);
        const score = keywords.filter(kw => q.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = item.a;
        }
    }
    
    if (bestMatch && bestScore > 0) {
        return bestMatch;
    }
    
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
        return "Namaste! I am Matadan AI. How can I help you with your election queries today?";
    }
    
    return "Great question! For accurate information, please call the Voter Helpline at **1950** or visit **voters.eci.gov.in**. You can also try one of the preloaded questions below.";
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
