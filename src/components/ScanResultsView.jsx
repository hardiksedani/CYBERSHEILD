import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Globe, FileText, AlertTriangle, Clock, ChevronDown, ChevronUp, Terminal, Cpu, CheckCircle } from 'lucide-react';
import './Dashboard.css'; // Reusing the same CSS

export default function ScanResultsView({ results, isScanning, onVerifyFix, onAnalyzeAI, urlInput }) {
    const [expandedVuln, setExpandedVuln] = useState(null);

    const toggleVuln = (idx) => {
        if (expandedVuln === idx) {
            setExpandedVuln(null);
        } else {
            setExpandedVuln(idx);
        }
    };

    const allVulnerabilities = results.flatMap(scan =>
        scan.vulnerabilities ? scan.vulnerabilities.map(v => ({ ...v, scanUrl: scan.url })) : []
    );

    return (
        <div className="dashboard-wrapper">
            <section className="dashboard-results-section" style={{ marginTop: '40px' }}>
                <div className="scan-complete-header">
                    <ShieldAlert size={48} color="#ffbb00" className="scan-complete-icon" />
                    <h2>{isScanning ? 'Scan in Progress...' : 'Scan Complete'}</h2>
                    <a href={results[0]?.url || urlInput} className="scan-complete-url" target="_blank" rel="noreferrer">
                        {results[0]?.url || urlInput || 'Unknown Target Target'}
                    </a>
                </div>

                <div className="scan-stats-grid">
                    <div className="stat-box">
                        <span className="stat-label"><Globe size={14} /> Pages Scanned</span>
                        <span className="stat-value">7</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label"><FileText size={14} /> Inputs Found</span>
                        <span className="stat-value">0</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label"><AlertTriangle size={14} /> Issues Found</span>
                        <span className="stat-value">{allVulnerabilities.length}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label"><Clock size={14} /> Duration</span>
                        <span className="stat-value">{results[0]?.scanDuration || '~30s'}</span>
                    </div>
                </div>

                <div className="scan-severity-badges">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
                        const count = allVulnerabilities.filter(v => v.severity === sev).length;
                        if (count === 0) return null;
                        return (
                            <div key={sev} className={`severity-pill ${sev.toLowerCase()}`}>
                                {sev} <span className="sev-count">x{count}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="vulnerabilities-list-container">
                    <h3 className="vuln-list-title">DETECTED VULNERABILITIES</h3>

                    <div className="vulnerability-list">
                        {allVulnerabilities.map((vuln, idx) => {
                            const isExpanded = expandedVuln === idx;

                            return (
                                <div className={`vuln-accordion-item ${isExpanded ? 'expanded' : ''}`} key={idx}>
                                    <div className="vuln-accordion-header" onClick={() => toggleVuln(idx)}>
                                        <div className="vuln-accordion-left">
                                            <ShieldAlert size={18} color="#888" className="vuln-accordion-icon" />
                                            <span className={`vuln-badge ${vuln.severity.toLowerCase()}`}>{vuln.severity}</span>
                                            <span className="vuln-accordion-title">{vuln.type}</span>
                                        </div>
                                        <div className="vuln-accordion-right">
                                            <span className="vuln-accordion-url"><Globe size={14} /> {vuln.scanUrl}</span>
                                            {isExpanded ? <ChevronUp size={20} color="#888" /> : <ChevronDown size={20} color="#888" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="vuln-accordion-content">
                                            <div className="vuln-content-inner">
                                                <p className="vuln-desc">{vuln.description || vuln.explanation}</p>
                                                <div className="vuln-location">
                                                    <strong>Location:</strong> {vuln.location}
                                                </div>
                                                <div className="vuln-actions horizontal">
                                                    <button className="btn-action-small fix" onClick={() => onVerifyFix(vuln)}>
                                                        <Terminal size={14} /> Verify & Fix
                                                    </button>
                                                    <button className="btn-action-small ai" onClick={() => onAnalyzeAI(vuln)}>
                                                        <Cpu size={14} /> AI Analysis
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {allVulnerabilities.length === 0 && !isScanning && (
                            <div className="no-vulns-state">
                                <CheckCircle size={48} color="#00ff88" />
                                <h3>No vulnerabilities found!</h3>
                                <p>The target application appears strictly secure against our tested vectors.</p>
                            </div>
                        )}
                    </div>

                    {allVulnerabilities.length > 0 && (
                        <div className="scan-disclaimer">
                            <h4><AlertTriangle size={16} /> Important Disclaimer</h4>
                            <ul>
                                <li>This scan covers common, preventable vulnerabilities only</li>
                                <li>It is not a replacement for professional penetration testing</li>
                                <li>Security testing reduces risk but does not eliminate all threats</li>
                                <li>Advanced attackers may exploit vulnerabilities not covered by this tool</li>
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
