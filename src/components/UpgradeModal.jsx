import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpgradeModal.css';

export default function UpgradeModal({ isOpen, onClose, onUnlock }) {
  const handleUpgradeClick = () => {
    // In a real app, this would redirect to Stripe/Paddle Checkout
    onUnlock();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="upgrade-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="upgrade-modal"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>

            {/* Header with Crown Icon */}
            <div className="modal-header">
              <motion.div
                className="crown-icon"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.div>
              <h1>Unlock Pro Features</h1>
              <p className="subtitle">Become an Elite Security Hunter</p>
            </div>

            {/* Features Grid */}
            <div className="features-grid">
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">📄</span>
                <h3>PDF Reports</h3>
                <p>Export professional security reports</p>
              </motion.div>
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">🔄</span>
                <h3>Bulk Scanning</h3>
                <p>Scan multiple IPs simultaneously</p>
              </motion.div>
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">📅</span>
                <h3>Scheduled Scans</h3>
                <p>Auto-run scans on a schedule</p>
              </motion.div>
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">⚙️</span>
                <h3>Custom Rules</h3>
                <p>Define your own vulnerability rules</p>
              </motion.div>
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">📊</span>
                <h3>Advanced Reports</h3>
                <p>Detailed analytics and trends</p>
              </motion.div>
              <motion.div className="feature-card" whileHover={{ y: -5 }}>
                <span className="feature-icon">🚀</span>
                <h3>Priority Support</h3>
                <p>Get help when you need it</p>
              </motion.div>
            </div>

            {/* Checkout / Upgrade Section */}
            <div className="license-section">
              <div className="pricing-box">
                <h2>$99 <span className="billing-cycle">/ lifetime</span></h2>
                <p className="pricing-desc">One-time payment. All future updates included.</p>
              </div>

              {/* Upgrade Button */}
              <motion.button
                className="unlock-btn"
                onClick={handleUpgradeClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="btn-text">💳 UPGRADE TO PREMIUM</span>
                <div className="btn-glow"></div>
              </motion.button>

              <div className="secure-checkout-badge">
                🔒 Secure checkout via Stripe
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <p>✨ Instant activation • No credit card required • Free to try</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
