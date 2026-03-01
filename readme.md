<div align="center">

# 🛡️ CyberShield
**Enterprise Web Security Testing & Automated Discovery Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-27.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

*Scan. Analyze. Mitigate.*

[Features](#features) • [Installation](#installation) • [Architecture](#architecture) • [AI Integration](#ai-powered-analysis)
</div>

---

## 🎯 Overview

**CyberShield** is a comprehensive desktop application designed for automated detection and analysis of web application vulnerabilities. Built on a modern technology stack combining Electron, React, Puppeteer, and **Google Gemini AI**, it empowers security professionals with AI-driven vulnerability assessments, reporting, and instant mitigation logic.

The application leverages headless browser automation to perform real-world attack simulations, detecting critical vulnerabilities including Cross-Site Scripting (XSS), SQL Injection, Cross-Site Request Forgery (CSRF), and security header misconfigurations.

---

## 🚀 Features

### Core Security Engine
- **Cross-Site Scripting (XSS)** - Detects reflected, stored, and DOM-based XSS vectors.
- **SQL Injection (SQLi)** - Tests for error-based, boolean-based, union-based, and time-based blind SQLi.
- **CSRF Validation** - Validates CSRF token protections and form vulnerabilities.
- **Security Headers** - Audits CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **Single Page App (SPA) Support** - Deep DOM scraping via headless Chromium to find hidden routes and hydrated endpoints.

### Advanced Capabilities
- **🧠 Google Gemini Integration** - Connects securely to the `gemini-2.5-flash` model to analyze any discovered vulnerabilities, instantly returning:
  - Exact JSON-formatted explanations of the risk
  - Copy-and-paste code patches
  - Realistic exploit examples
- **🔒 Secure Domain Verification** - Forces users to verify domain ownership via HTML meta tags before advanced scans run.
- **💸 Razorpay Subscriptions** - Built-in secure payment gateway for Premium feature unlocks.
- **📊 PDF Reporting** - Generates beautiful, exportable PDF executive summaries for clients.
- **💾 Local First Architecture** - All scanning history and vulnerabilities are saved locally to SQLite/JSON and synced to Supabase.

---

## 🛠️ Technology Stack

| Architecture | Technologies |
|--------------|-------------|
| **Frontend** | React, Vite, Framer Motion, CSS Variables |
| **Backend** | Electron (Node.js), Puppeteer, Razorpay, Supabase |
| **AI Engine** | Google Generative AI (Gemini Flash Model) |
| **Database** | Supabase PostgreSQL + Local `store.json` IPC |

---

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- A Supabase Project
- A Google Gemini API Key
- A Razorpay Account (for premium features)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/your-username/cybershield.git
cd cybershield
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your credentials:
\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY=your_razorpay_key
VITE_GEMINI_API_KEY=your_gemini_api_key
\`\`\`

### 4. Run the Application
To run the app locally in development mode:
\`\`\`bash
npm run dev     # (Terminal 1) Starts the Vite React server
npm start       # (Terminal 2) Builds the app and launches the Electron wrapper
\`\`\`

---

## 🏗️ Building for Production

To package the application into a standalone executable:

**For Windows:**
\`\`\`bash
npm run build:win
\`\`\`

**For macOS:**
\`\`\`bash
npm run build:mac
\`\`\`

**For Linux (AppImage):**
\`\`\`bash
npm run build:linux
\`\`\`

---

## 🤖 AI-Powered Analysis

CyberShield's most powerful feature is its real-time AI Analyst. When a vulnerability is found in the dashboard, simply click the **AI Analysis** trigger. 

CyberShield will securely package the vulnerability context, severity, and injection vector into a prompt and send it to Google's Gemini Flash model locally. The AI returns a strict JSON payload that is rendered dynamically in the UI—providing an executive summary, remediation steps, and secure code alternatives.

---

## 🛡️ License

This project is licensed under the MIT License.
