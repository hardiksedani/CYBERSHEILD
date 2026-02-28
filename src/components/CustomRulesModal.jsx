import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Plus, ClipboardList, Trash2, Download, Check } from 'lucide-react';
import './CustomRulesModal.css';

export default function CustomRulesModal({ isOpen, onClose }) {
  const [rules, setRules] = useState([
    { port: 22, service: 'SSH', severity: 'LOW' },
    { port: 80, service: 'HTTP', severity: 'MEDIUM' },
    { port: 443, service: 'HTTPS', severity: 'LOW' },
    { port: 3389, service: 'RDP', severity: 'CRITICAL' },
  ]);
  const [newRule, setNewRule] = useState({ port: '', service: '', severity: 'MEDIUM' });

  const severityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const addRule = () => {
    if (newRule.port && newRule.service) {
      setRules([...rules, newRule]);
      setNewRule({ port: '', service: '', severity: 'MEDIUM' });
    }
  };

  const deleteRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const exportRules = () => {
    const json = JSON.stringify(rules, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json));
    element.setAttribute('download', `custom_rules_${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      className={`rules-modal-overlay ${isOpen ? 'open' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rules-modal"
        initial={{ scale: 0.8 }}
        animate={{ scale: isOpen ? 1 : 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}><X size={20} /></button>

        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={28} /> Custom Rules</h1>
        <p>Define custom vulnerability scanning rules</p>

        {/* Add New Rule */}
        <div className="add-rule-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Add Custom Rule</h3>
          <div className="rule-form">
            <input
              type="number"
              placeholder="Port"
              value={newRule.port}
              onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
              min="1"
              max="65535"
            />
            <input
              type="text"
              placeholder="Service Name"
              value={newRule.service}
              onChange={(e) => setNewRule({ ...newRule, service: e.target.value })}
            />
            <select
              value={newRule.severity}
              onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
            >
              {severityOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button className="btn-add" onClick={addRule} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Rules List */}
        <div className="rules-list-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={18} /> Current Rules</h3>
          <div className="rules-list">
            {rules.map((rule, idx) => (
              <motion.div
                key={idx}
                className={`rule-card severity-${rule.severity.toLowerCase()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="rule-info">
                  <div className="rule-port">:{rule.port}</div>
                  <div className="rule-service">{rule.service}</div>
                  <div className={`rule-severity ${rule.severity.toLowerCase()}`}>
                    {rule.severity}
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => deleteRule(idx)}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="rules-actions">
          <button className="btn-export" onClick={exportRules} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Download size={16} /> Export Rules
          </button>
          <button className="btn-close" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={16} /> Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
