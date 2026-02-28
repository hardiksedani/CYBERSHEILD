import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Rocket, Download, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import './BulkScanModal.css';

export default function BulkScanModal({ isOpen, onClose }) {
  const [scanTargets, setScanTargets] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleBulkScan = async () => {
    const targets = scanTargets
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (targets.length === 0) {
      alert('Please enter at least one target');
      return;
    }

    setIsScanning(true);
    setResults([]);
    setProgress(0);

    try {
      if (!window.electron) {
        alert('Scanning not available');
        return;
      }

      const scanResults = [];
      const increment = 100 / targets.length;

      for (const target of targets) {
        try {
          const result = await window.electron.scanNetwork(target);
          scanResults.push({
            target,
            status: result?.status || 'OFFLINE',
            critical: result?.vulnerabilities?.CRITICAL || 0,
            high: result?.vulnerabilities?.HIGH || 0,
            medium: result?.vulnerabilities?.MEDIUM || 0,
            low: result?.vulnerabilities?.LOW || 0,
            timestamp: new Date().toLocaleTimeString()
          });
          setProgress(prev => Math.min(prev + increment, 95));
        } catch (error) {
          scanResults.push({
            target,
            status: 'ERROR',
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }

      setResults(scanResults);
      setProgress(100);
    } catch (error) {
      console.error('Bulk scan error:', error);
      alert('Bulk scan failed: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Target', 'Status', 'Critical', 'High', 'Medium', 'Low', 'Scanned At'],
      ...results.map(r => [
        r.target,
        r.status,
        r.critical,
        r.high,
        r.medium,
        r.low,
        r.timestamp
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `bulk_scan_${Date.now()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      className={`bulk-modal-overlay ${isOpen ? 'open' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bulk-modal"
        initial={{ scale: 0.8 }}
        animate={{ scale: isOpen ? 1 : 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}><X size={20} /></button>

        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={28} /> Bulk Scanning</h1>
        <p>Scan multiple targets simultaneously</p>

        {!isScanning && results.length === 0 && (
          <>
            <textarea
              placeholder="Enter IPs or URLs (one per line)&#10;e.g.&#10;10.0.0.1&#10;192.168.1.1&#10;example.com"
              value={scanTargets}
              onChange={(e) => setScanTargets(e.target.value)}
              className="targets-input"
              disabled={isScanning}
            />
            <button
              className="scan-btn"
              onClick={handleBulkScan}
              disabled={isScanning || scanTargets.trim().length === 0}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isScanning ? (
                <><RefreshCw className="spinner-icon" size={18} /> Scanning...</>
              ) : (
                <><Rocket size={18} /> Start Bulk Scan</>
              )}
            </button>
          </>
        )}

        {isScanning && (
          <div className="scanning-state">
            <motion.div
              className="spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <p>Scanning {results.length}/{scanTargets.split('\n').filter(t => t.trim()).length} targets...</p>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="progress-text">{Math.round(progress)}%</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-state">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={20} /> Scan Results</h2>
            <div className="results-table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Status</th>
                    <th>🔴 Critical</th>
                    <th>🟠 High</th>
                    <th>🟡 Medium</th>
                    <th>🔵 Low</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} className={`row-${r.status.toLowerCase()}`}>
                      <td>{r.target}</td>
                      <td className="status">{r.status}</td>
                      <td className="critical">{r.critical}</td>
                      <td className="high">{r.high}</td>
                      <td className="medium">{r.medium}</td>
                      <td className="low">{r.low}</td>
                      <td>{r.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="action-buttons">
              <button className="btn-export" onClick={exportResults} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={16} /> Export CSV
              </button>
              <button className="btn-new-scan" onClick={() => { setResults([]); setScanTargets(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> New Scan
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
