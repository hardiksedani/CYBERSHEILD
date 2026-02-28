import React, { useState } from 'react';
import {
  Zap,
  Search,
  Shield,
  CheckCircle2,
  History,
  Network,
  Server,
  Download,
  Crown,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import '../styles/SecuritySidebar.css';

const SecuritySidebar = ({ onScan, onNavigate }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeSection, setActiveSection] = useState('url-scanner');

  const handleScan = () => {
    if (urlInput.trim()) {
      onScan?.(urlInput);
      setUrlInput('');
    }
  };

  const handleQuickAction = (action) => {
    setActiveSection(action);
    onNavigate?.(action);
    setIsMobileOpen(false);
  };

  const handleUpgrade = () => {
    onNavigate?.('upgrade');
    setIsMobileOpen(false);
  };

  const scanCapabilities = [
    { icon: Zap, label: 'XSS Injection Detection', id: 'xss' },
    { icon: Shield, label: 'CSRF Token Validation', id: 'csrf' },
    { icon: CheckCircle2, label: 'Security Headers Check', id: 'headers' },
    { icon: AlertCircle, label: 'SQL Injection Testing', id: 'sql' },
    { icon: Network, label: 'CORS Misconfiguration', id: 'cors' },
    { icon: CheckCircle2, label: 'Authentication Issues', id: 'auth' },
  ];

  const quickActions = [
    { icon: History, label: 'History', id: 'history' },
    { icon: Network, label: 'Network Scanner', id: 'network' },
    { icon: Server, label: 'SSL Scanner', id: 'infrastructure' },
    { icon: Download, label: 'Export', id: 'export' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`security-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* URL Scanner Section */}
        <div className="sidebar-section url-scanner-card">
          <div className="url-scanner-header">
            <h2 className="section-title">URL Scanner</h2>
            <span className="free-badge">FREE</span>
          </div>

          <div className="url-input-wrapper">
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              aria-label="Enter URL to scan"
            />
          </div>

          <button
            className="scan-button"
            onClick={handleScan}
            disabled={!urlInput.trim()}
            aria-label="Scan URL"
          >
            <Zap size={18} className="button-icon" />
            <span>SCAN</span>
          </button>
        </div>

        {/* Scan Capabilities Section */}
        <div className="sidebar-section capabilities-section">
          <h3 className="section-label">SCAN CAPABILITIES</h3>

          <ul className="capabilities-list">
            {scanCapabilities.map((capability) => {
              const IconComponent = capability.icon;
              return (
                <li key={capability.id} className="capability-item">
                  <IconComponent size={18} className="capability-icon" />
                  <span className="capability-label">{capability.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Actions Section */}
        <div className="sidebar-section quick-actions-section">
          <h3 className="section-label">QUICK ACTIONS</h3>

          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.id}
                  className={`quick-action-button ${
                    activeSection === action.id ? 'active' : ''
                  }`}
                  onClick={() => handleQuickAction(action.id)}
                  aria-label={action.label}
                  title={action.label}
                >
                  <IconComponent size={20} className="action-icon" />
                  <span className="action-label">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrade / Pro Section */}
        <div className="sidebar-section upgrade-card">
          <div className="upgrade-header">
            <Crown size={24} className="crown-icon" />
            <h3 className="upgrade-title">Unlock Pro Features</h3>
          </div>

          <p className="upgrade-description">
            PDF Reports • Bulk Scanning • API Access • Priority Support
          </p>

          <button
            className="upgrade-button"
            onClick={handleUpgrade}
            aria-label="Upgrade to Pro"
          >
            Upgrade Now
          </button>
        </div>
      </aside>
    </>
  );
};

export default SecuritySidebar;
