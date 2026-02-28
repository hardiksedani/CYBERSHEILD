import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, Bot, Clock, Layers, AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle, Terminal, Cpu, ChevronDown, ChevronUp, Globe, Zap } from 'lucide-react';
import BulkScanModal from './BulkScanModal';
import CustomRulesModal from './CustomRulesModal';
import ScheduledScansModal from './ScheduledScansModal';
import './Dashboard.css';

// Reusing previous severity color definitions for UI elements
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '#ff4444';
    case 'HIGH': return '#ff8800';
    case 'MEDIUM': return '#ffbb00';
    case 'LOW': return '#00ccff';
    default: return '#888888';
  }
};

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'CRITICAL': return <ShieldAlert size={18} color="#ff4444" />;
    case 'HIGH': return <AlertTriangle size={18} color="#ff8800" />;
    case 'MEDIUM': return <AlertTriangle size={18} color="#ffbb00" />;
    case 'LOW': return <ShieldCheck size={18} color="#00ccff" />;
    default: return <CheckCircle size={18} color="#888888" />;
  }
};

export default function Dashboard({ results, isScanning, onNewScan, onVerifyFix, onAnalyzeAI = () => { }, isPro = false, onOpenUpgrade = () => { } }) {
  const [urlInput, setUrlInput] = useState('');
  const [showBulkScan, setShowBulkScan] = useState(false);
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [expandedVuln, setExpandedVuln] = useState(null);

  const toggleVuln = (idx) => {
    if (expandedVuln === idx) {
      setExpandedVuln(null);
    } else {
      setExpandedVuln(idx);
    }
  };

  const handleRazorpayCheckout = () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || "", // Set in .env.local
      amount: "830000", // ~8300 INR (approx $99 USD) in paise
      currency: "INR", // Setting to INR natively unlocks UPI and Netbanking
      name: "CyberShield Security",
      description: "Lifetime EPYC Pro Suite Access",
      image: "https://example.com/your_logo",
      handler: function (response) {
        // This runs on successful payment
        alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);

        // In a real app, you would send this to your backend to verify
        // For now, we simulate unlocking the pro tier immediately
        onOpenUpgrade(); // This currently triggers the handleUnlockPro function in App.jsx
      },
      prefill: {
        name: "Enterprise User",
        email: "user@example.com",
        contact: "9999999999"
      },
      theme: {
        color: "#00d4d4"
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', function (response) {
      alert("Payment Failed: " + response.error.description);
    });
    rzp1.open();
  };

  // Filter and flatten vulnerabilities if there's any active scan ongoing/finished
  const allVulnerabilities = results.flatMap(scan =>
    scan.vulnerabilities ? scan.vulnerabilities.map(v => ({ ...v, scanUrl: scan.url })) : []
  );

  const startHeroScan = () => {
    if (!urlInput.trim()) return;
    onNewScan(urlInput.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      startHeroScan();
    }
  };

  return (
    <div className="dashboard-wrapper">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-icon-wrapper">
            <Shield size={64} className="hero-shield" />
          </div>
          <h1 className="hero-title">
            Authorized Security<br />
            <span className="hero-cyan">Scanner</span>
          </h1>
          <p className="hero-subtitle">
            Enterprise-Grade Web Security Testing. Find vulnerabilities before attackers do.
          </p>

          <div className="hero-input-group">
            <input
              type="text"
              className="hero-url-input"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isScanning}
            />
            <button
              className={`hero-scan-btn ${isScanning ? 'scanning' : ''}`}
              onClick={startHeroScan}
              disabled={isScanning}
            >
              {isScanning ? 'SCANNING...' : 'SCAN'}
            </button>
          </div>
          <p className="hero-input-hint">Ownership verification required before scanning begins.</p>
        </motion.div>
      </section>



      {/* Feature Cards Section */}
      <section className="features-section">
        <motion.div
          className="premium-cards-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="premium-card" style={{ cursor: 'default' }}>
            <Lock size={32} className="premium-icon" style={{ color: '#00ccff' }} />
            <h3>Ownership First</h3>
            <p>META tag verification ensures you control the target website before any test.</p>
          </div>
          <div className="premium-card" style={{ cursor: 'default' }}>
            <ShieldCheck size={32} className="premium-icon" style={{ color: '#00ff88' }} />
            <h3>Non-Destructive</h3>
            <p>Safe payloads only. No Denial of Service (DoS) and no brute force attacks.</p>
          </div>
          <div className="premium-card" style={{ cursor: 'default' }}>
            <Cpu size={32} className="premium-icon" style={{ color: '#ff4444' }} />
            <h3>AMD Ryzen™ AI Reports</h3>
            <p>Accelerated by AMD Ryzen™ AI for precise attack scenario modeling and remediation.</p>
          </div>
        </motion.div>
      </section>

      {/* Premium Section - For Free Users AND Unauthenticated Users */}
      {!isPro && (
        <section className="premium-section">
          <motion.div
            className="premium-container"
            style={{ paddingBottom: '0', marginBottom: '0' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="premium-title">⭐ Go Premium</h2>
            <div className="premium-cards-grid">

              <div className="premium-card">
                <FileText size={32} className="premium-icon" />
                <h3>PDF Reports</h3>
                <p>Download full vulnerability PDF reports</p>
              </div>

              <div className="premium-card">
                <Layers size={32} className="premium-icon" />
                <h3>Multi-Site Scanning</h3>
                <p>Scan multiple websites at once</p>
              </div>

              <div className="premium-card">
                <Clock size={32} className="premium-icon" />
                <h3>Scheduled Scans</h3>
                <p>Automate scans at specific date and time</p>
              </div>

            </div>

            <button
              className="premium-cta-btn"
              onClick={handleRazorpayCheckout}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ff4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Zap size={20} /> Upgrade to Premium ($99)
            </button>
          </motion.div>
        </section>
      )}

      {/* Pro Features Dashboard - For Pro Users */}
      {isPro && (
        <section className="pro-dashboard-section">
          <motion.div
            className="pro-container"
            style={{ paddingBottom: '0', marginBottom: '0' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="pro-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 className="pro-title">👑 AMD EPYC™ Pro Suite</h2>
                <p className="pro-subtitle">Your enterprise tools are unlocked and accelerated by AMD EPYC™ Secure Infrastructure.</p>
              </div>
              <button
                onClick={handleRazorpayCheckout}
                className="premium-cta-btn"
                style={{
                  margin: 0,
                  background: 'linear-gradient(135deg, #a855f7 0%, #ff4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
                }}>
                <Zap size={20} /> Upgrade to Premium ($99)
              </button>
            </div>

            <div className="premium-cards-grid">
              <div className="premium-card action-card" onClick={() => setShowCustomRules(true)}>
                <FileText size={32} className="premium-icon" style={{ color: '#ffbb00' }} />
                <h3>Custom Rules</h3>
                <p>Define enterprise compliance policies</p>
              </div>

              <div className="premium-card action-card" onClick={() => setShowBulkScan(true)}>
                <Layers size={32} className="premium-icon" style={{ color: '#00d4d4' }} />
                <h3>Multi-Site Scanning</h3>
                <p>Scan multiple websites simultaneously</p>
              </div>

              <div className="premium-card action-card" onClick={() => setShowScheduled(true)}>
                <Clock size={32} className="premium-icon" style={{ color: '#a855f7' }} />
                <h3>Scheduled Scans</h3>
                <p>Automate daily security checks</p>
              </div>

              <div className="premium-card action-card" onClick={() => {
                if (results && results.length > 0) {
                  window.electron?.generatePDFReport(results[0])
                } else {
                  alert("No scan results available to generate a PDF. Please run a scan first!");
                }
              }}>
                <FileText size={32} className="premium-icon" style={{ color: '#ff4444' }} />
                <h3>PDF Reports</h3>
                <p>Download full vulnerability history</p>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Copyright Footer */}
      <div style={{ marginTop: 'auto', textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
        © 2026 ALL RIGHT RESERVED HARDIK SEDANI
      </div>

      {/* Modals placed here out of flow */}
      <BulkScanModal isOpen={showBulkScan} onClose={() => setShowBulkScan(false)} />
      <CustomRulesModal isOpen={showCustomRules} onClose={() => setShowCustomRules(false)} />
      <ScheduledScansModal isOpen={showScheduled} onClose={() => setShowScheduled(false)} />

    </div>
  );
}
