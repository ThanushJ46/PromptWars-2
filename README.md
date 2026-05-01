# 🗳️ MATADAN — India's Complete Election Education Platform

> **Google Prompt Wars 2 Submission**  
> Vertical: **Civic Education & Public Services Assistant**  
> Live Demo: [https://matadan-175321574215.asia-south1.run.app](https://matadan-175321574215.asia-south1.run.app)  
> Test Suite: [https://matadan-175321574215.asia-south1.run.app/tests.html](https://matadan-175321574215.asia-south1.run.app/tests.html)

---

## 🎯 Chosen Vertical

**Civic Education / Government Services Assistant**

Matadan (मतदान / ಮತದಾನ — meaning "Voting" in Hindi & Kannada) is a smart, multilingual civic education assistant that guides Indian voters through every stage of the electoral process — from registration to casting their ballot on election day.

---

## 🧠 Approach & Logic

### Problem Statement
Millions of eligible Indian voters — especially first-time voters, NRIs, students in hostels, and rural citizens — face confusion about:
- Which documents they need to vote
- Which form to fill (Form 6 vs 6A vs 8A vs 8)
- What happens inside a polling booth (EVM, VVPAT)
- How to report election code violations

### Solution: "Bite → Snack → Meal" Information Architecture
Instead of dumping all information at once, Matadan delivers context progressively:

| Layer | What the user sees | Example |
|-------|-------------------|---------|
| **Bite** | Stats bar — instant context | "96.8 Crore Voters · 543 Seats · Age 18+" |
| **Snack** | Quick YES/NO decision | "Do you have your Voter ID?" → YES (ready!) / NO (12 alternate docs) |
| **Meal** | Full walkthrough when needed | 5-step registration guide, EVM simulator, Election Day timeline |

---

## 🤖 Smart Assistant & Decision Making

### Context-Aware Form Routing
The app doesn't just list all forms — it **routes the user to the correct one** based on their situation:

```
User says "No, I don't have a Voter ID" →
  Show 12 alternate documents (ECI-approved) →
    "Apply Now" routes to:
      ├── Form 6  → New Indian voter (18+)
      ├── Form 6A → NRI voter (overseas citizen)
      ├── Form 8A → Address has changed
      └── Form 8  → Correction in existing Voter ID
```

### AI Chatbot with Graceful Degradation
```
User asks a question →
  ├── API key available? → Gemini 2.0 Flash (multi-turn, system-prompted)
  └── No API key / offline? → Keyword-match against preloaded Q&A in current language
  Always → Never returns "sorry, can't help" — provides helpline (1950) + official link
```

The chatbot maintains **conversation history** for multi-turn context, and its system prompt constrains it to election-related topics only.

### Language-Aware Rendering
When the user switches language (EN / HI / KN):
- All UI text re-renders instantly (no page reload)
- Chatbot preloaded questions switch to the selected language
- Chat popup label updates to the correct language
- `<html lang>` attribute updates for screen readers

---

## 🔧 How the Solution Works

### Core Features & Design Reasoning

| Feature | Why It Exists | Powered By |
|---------|--------------|------------|
| 🤖 **Matadan AI Chatbot** | Voters have questions at odd hours — they need instant answers, not a helpline queue. Falls back to preloaded Q&A when offline because internet isn't guaranteed in every village. | Google Gemini 2.0 Flash |
| ✅ **Am I Ready?** | Most voters don't know if they're prepared. A simple YES/NO flow with 12 alternate documents removes anxiety before election day. | Built-in logic |
| 📋 **Smart Form Router** | India has 4 different voter forms — most people fill the wrong one. The app asks your situation and routes you to the correct form automatically. | Built-in logic |
| 🗺️ **Booth Locator** | "Where do I vote?" is the #1 question on election day. GPS + pincode search gives an instant answer. | Google Maps JS API |
| 🗳️ **New Voter Walkthrough** | First-time voters need hand-holding. A 5-step visual stepper breaks registration into manageable steps. | Built-in stepper |
| ⚡ **EVM & VVPAT Simulator** | Many voters have never seen a voting machine. An interactive demo builds confidence before they enter the booth. | CSS/JS animation |
| 🕐 **Election Day Journey** | Voters don't know what to expect — queue, ID check, ink, EVM, VVPAT. An animated timeline removes all surprises. | Scroll animation |
| 📅 **Reminder System** | People forget election dates. One-click calendar integration ensures they show up. | Google Calendar API |
| 📱 **cVIGIL & 1950 Helpline** | Election violations go unreported. Quick access to the ECI's official reporting tools empowers citizens. | ECI links |
| 🌐 **Trilingual (EN/HI/KN)** | India isn't English-only. Hindi and Kannada ensure accessibility for non-English speakers. Built to scale to more languages. | i18n data system |

### UI/UX Design Philosophy

- **Built with Google Stitch** — Used Gemini to generate precise design prompts for Stitch, creating a clean, professional UI that stands out from typical AI-generated interfaces
- **Designed for rural first-time voters** — No information overload, no clutter. Just what you need, when you need it
- **Mobile-first** — Bottom tab navigation, touch-optimized cards, because most Indian voters use phones, not laptops
- **SVG icons over emoji** — Consistent rendering across all devices and platforms

### Navigation Architecture
```
Home → Stats → Voter's Oath → Navigation Cards
Am I Ready? → YES (ready) / NO (12 alternate docs + 4 form routes)
Apply for Voter ID → Form 6 / 6A / 8A / 8 (accordion cards)
New Voter Guide → 5-step walkthrough stepper
Election Day → Animated timeline with EVM & VVPAT demo
Find My Booth → Google Maps with geolocation
More → Reminder + Report Violation + cVIGIL + Helpline 1950
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript (zero-build) |
| AI | Google Gemini 2.0 Flash API |
| Maps | Google Maps JavaScript API |
| Calendar | Google Calendar API |
| Fonts | Google Fonts (Noto Sans family — trilingual) |
| Deployment | Google Cloud Run (asia-south1) + nginx |
| Icons | Inline SVG (no external font dependency) |

---

## 📁 File Structure

```
matadan/
├── index.html              # Main SPA entry point
├── tests.html              # In-browser test suite (80+ assertions)
├── Dockerfile              # nginx container for Cloud Run
├── docker-entrypoint.sh    # Runtime ENV injection script
├── nginx.conf              # Production nginx with security headers
├── css/
│   ├── main.css            # Design tokens, typography, base styles
│   ├── components.css      # All UI components (cards, tabs, chatbot, stepper)
│   ├── animations.css      # Scroll animations, transitions
│   └── responsive.css      # Mobile-first responsive breakpoints
└── js/
    ├── app.js              # Page router, language switcher, form accordion, stepper
    ├── chatbot.js          # Gemini AI integration, popup logic, offline fallback
    ├── data.js             # Trilingual content strings (EN / HI / KN)
    ├── maps.js             # Google Maps booth locator integration
    ├── reminder.js         # Google Calendar + native reminder
    └── env.js              # Environment config (overwritten at runtime in Cloud Run)
```

---

## 🌐 Google Services Integration

| # | Service | How It's Used |
|---|---------|--------------|
| 1 | **Gemini 2.0 Flash** | Powers the AI chatbot with system prompt + multi-turn conversation history |
| 2 | **Google Maps JS API** | Polling booth locator with geolocation, custom map styling, and marker placement |
| 3 | **Google Calendar** | One-click "Add to Calendar" for election day reminders |
| 4 | **Google Fonts** | Noto Sans trilingual typeface stack (Latin, Devanagari, Kannada) |
| 5 | **Google Cloud Run** | Serverless containerized deployment with runtime env injection |

---

## ⚠️ Assumptions Made

1. The app targets primarily **mobile users** (bottom tab bar navigation, touch-optimized)
2. Voter registration data is static/demo — real integration would require ECI API access
3. The Gemini API key is provided via environment variables — the app gracefully falls back to preloaded Q&A if missing
4. Google Maps booth data uses geolocation + simulated offset — production would use ECI's official booth database
5. The app is intentionally kept as a **zero-build vanilla web app** for maximum accessibility, portability, and minimum setup

---

## ♿ Accessibility

- Semantic HTML5 (`<nav>`, `<section>`, `<button>`) with proper heading hierarchy
- `aria-label` on all interactive elements
- `aria-live="polite"` on chat messages (screen readers announce new messages)
- Skip-to-content link for keyboard users
- Focus-visible styling (`outline: 2px solid saffron`)
- `.sr-only` class for screen-reader-only text
- High-contrast color palette (saffron/navy/white)
- Minimum 14px font across all breakpoints
- SVG icons in navigation (no emoji — consistent cross-platform rendering)

---

## 🔒 Security

- **Zero Secret Commits**: No API keys anywhere in the repository or git history
- **Runtime Injection**: Keys are injected at container startup via `docker-entrypoint.sh`
- **XSS Prevention**: Chat messages are HTML-escaped before rendering; only safe `**bold**` markdown is allowed
- **Security Headers**: `nginx.conf` includes `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- All external links use `target="_blank" rel="noopener noreferrer"`
- No user data stored server-side — reminders are device-local only

---

## 🧪 Testing

Open `tests.html` in the browser to run the full test suite (80+ assertions):

```bash
# From the matadan directory:
python -m http.server 8080
# Visit http://localhost:8080/tests.html
```

The test suite validates:
- **Environment config**: `ENV` object structure and key presence
- **I18n parity**: All 3 languages cover the same keys (zero missing translations)
- **Chat data integrity**: Every preloaded Q&A has non-empty `q` and `a` fields across all languages
- **Content correctness**: Helpline number (1950) and official URL presence
- **Form routing**: All 4 form types (6, 6A, 8A, 8) are defined
- **Security**: No hardcoded API keys, no legacy `CONFIG` object in global scope

---

## 🚀 Running Locally

```bash
# 1. Edit matadan/js/env.js to add your API keys (for local testing only)
# 2. Start local server
cd matadan
python -m http.server 8080
# Open http://localhost:8080
```

## 📦 Deploying to Cloud Run

```bash
gcloud run deploy matadan \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_KEY=YOUR_KEY,MAPS_KEY=YOUR_KEY"
```

---

*Built with Google Antigravity for Prompt Wars 2 — Civic Education Vertical*  
*Matadan = मतदान = ಮತದಾನ = "Voting"*
