# 🗺️ RouteWise — *your trip.your way*

[![Live Demo](https://img.shields.io/badge/Vercel-Live_App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://routewise-gold.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/arighna-05/RouteWise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **RouteWise** is a modern, AI-assisted travel & tour planning platform designed to make trip curation effortless, visual, and personal. From real-time weather forecasts to an authentic **Handwritten Paper Journal** export and an intelligent floating **AI Tour Concierge**, RouteWise helps travelers plan their dream trips with precision and charm.

---

## 🔗 Live Application & Repository

- **🌐 Live Web Application**: [https://routewise-gold.vercel.app](https://routewise-gold.vercel.app)
- **📦 GitHub Source Repository**: [https://github.com/arighna-05/RouteWise](https://github.com/arighna-05/RouteWise)

---

## ✨ Key Features & How It Works

### 1. 🔍 Smart Destination & Traveler Setup
- Search destinations worldwide with instant live suggestions.
- Configure family/traveler details with custom age pickers (0 to 100+ years).
- Automatic identification and assistance notes for seniors (`🌿`) and children (`👶`).

### 2. 🗓️ Interactive Multi-Day Itinerary Planner
- Multi-day timeline with drag-and-drop activity ordering.
- Automated distance & transit time estimators between consecutive spots (`⤹ 🚗`).
- Pre-made curated tour templates for major global destinations.
- Real-time total cost breakdown and packing list integration.

### 3. 🤖 Floating AI Tour Concierge
- Persistent floating assistant situated on the bottom-right corner.
- Focused strictly on your specific tour destination (refuses off-topic prompts to stay zeroed-in on your trip).
- **1-Tap Add to Tour**: Tapping any suggested landmark directly injects it into your active itinerary day.

### 4. 📖 Authentic Handwritten Paper Journal (Print & Export)
- Transform any digital itinerary into a physical handwritten paper journal with parchment texture (`#fdfaf2`), ruled notebook lines, and red margin guidelines.
- **Fountain Pen Ink Switcher**: Switch between **🖋️ Royal Blue Fountain Pen**, **🖊️ Black Ink**, and **✏️ Graphite Pencil**.
- **1-Click Print to PDF**: Optimized `@media print` rules export clean high-resolution printable journal pages without UI clutter.

### 5. ⛅ Live Weather & Global Attraction Engine
- Real-time weather forecasts powered by Open-Meteo.
- Live attraction photos and Wikipedia summaries fetched dynamically for any city on Earth.

### 6. 💰 Travel Expense & Budget Tracker
- Real-time expense breakdown with category filters (Stay, Transport, Food, Activities).
- Multi-currency support and per-person cost calculations.

---

## 🛠️ Architecture & Zero-Key System

RouteWise is engineered to run seamlessly out-of-the-box **without requiring any API keys**:

| Feature | Provider / Method | Key Required? |
|---|---|---|
| **Live Weather** | [Open-Meteo API](https://open-meteo.com/) | ❌ No Key Needed |
| **Global Places & Photos** | [Wikipedia MediaWiki Open API](https://www.mediawiki.org/) | ❌ No Key Needed |
| **Route & Transit Estimator** | In-Browser Distance & Haversine Calculation | ❌ No Key Needed |
| **Expense Calculator** | Local Engine | ❌ No Key Needed |
| **AI Concierge & Tour Notes** | Google Gemini 2.5 Flash *(Optional)* + Fallback Engine | ⚡ Optional (`VITE_GEMINI_API_KEY`) |

If `VITE_GEMINI_API_KEY` is provided, RouteWise connects directly to Google Gemini 2.5 Flash. If left empty, RouteWise automatically utilizes its built-in intelligent travel knowledge base.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arighna-05/RouteWise.git
   cd RouteWise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # Add your optional VITE_GEMINI_API_KEY if desired
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🧰 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Custom Vintage Handwritten Typography (`Caveat`, `Patrick Hand`)
- **Icons**: Lucide React Icons
- **Deployment**: Vercel (SPA rewrite rules configured)
- **Effects**: Canvas Confetti

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p center align="center">
  <b>RouteWise</b> • <i>your trip.your way</i>
</p>
