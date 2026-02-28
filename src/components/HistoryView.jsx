import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Eye, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import './HistoryView.css'

export default function HistoryView({ onLoadScan }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      if (window.electron) {
        const data = await window.electron.getScanHistory()
        setHistory(data || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (scanEntry) => {
    if (onLoadScan) {
      onLoadScan({
        url: scanEntry.url,
        vulnerabilities: scanEntry.vulnerabilities,
        metadata: { ...scanEntry.metadata, loadedFrom: 'history' }
      })
    }
  }

  const handleDeleteEntry = async (timestamp) => {
    try {
      if (window.electron) {
        const result = await window.electron.deleteScanEntry(timestamp)
        if (result.success) {
          setHistory(history.filter(entry => entry.timestamp !== timestamp))
          setDeleteConfirm(null)
        }
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      try {
        if (window.electron) {
          const result = await window.electron.clearScanHistory()
          if (result.success) {
            setHistory([])
            setDeleteConfirm(null)
          }
        }
      } catch (error) {
        console.error('Error clearing history:', error)
      }
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getSeverityCounts = (vulnerabilities) => {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }

    vulnerabilities.forEach(vuln => {
      const severity = vuln.severity || 'LOW'
      if (counts.hasOwnProperty(severity)) {
        counts[severity]++
      }
    })

    return counts
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ff006e'
      case 'HIGH':
        return '#ff9500'
      case 'MEDIUM':
        return '#ffd60a'
      case 'LOW':
        return '#00d4ff'
      default:
        return '#888'
    }
  }

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading scan history...</p>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <motion.div
        className="history-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="empty-state">
          <AlertCircle size={48} className="empty-icon" />
          <h2>No Scan History</h2>
          <p>You haven't performed any scans yet. Start by running a security scan to see results here.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="history-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="history-header">
        <h1>📋 Scan History</h1>
        <motion.button
          className="btn-clear-all"
          onClick={handleClearAll}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 size={16} /> Clear All ({history.length})
        </motion.button>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Target URL</th>
              <th>Vulnerabilities</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {history.map((entry, index) => {
                const counts = getSeverityCounts(entry.vulnerabilities || [])
                const totalVulns = Object.values(counts).reduce((a, b) => a + b, 0)

                return (
                  <motion.tr
                    key={entry.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={deleteConfirm === entry.timestamp ? 'deleting' : ''}
                  >
                    <td className="cell-date">
                      <span className="date-text">{formatDate(entry.timestamp)}</span>
                    </td>

                    <td className="cell-url">
                      <span className="url-text" title={entry.url}>
                        {entry.url}
                      </span>
                    </td>

                    <td className="cell-vulnerabilities">
                      <div className="severity-badges">
                        {counts.CRITICAL > 0 && (
                          <motion.span
                            className="badge critical"
                            whileHover={{ scale: 1.1 }}
                            title="Critical vulnerabilities"
                          >
                            <Zap size={12} /> {counts.CRITICAL}
                          </motion.span>
                        )}
                        {counts.HIGH > 0 && (
                          <motion.span
                            className="badge high"
                            whileHover={{ scale: 1.1 }}
                            title="High vulnerabilities"
                          >
                            <AlertCircle size={12} /> {counts.HIGH}
                          </motion.span>
                        )}
                        {counts.MEDIUM > 0 && (
                          <motion.span
                            className="badge medium"
                            whileHover={{ scale: 1.1 }}
                            title="Medium vulnerabilities"
                          >
                            {counts.MEDIUM}
                          </motion.span>
                        )}
                        {counts.LOW > 0 && (
                          <motion.span
                            className="badge low"
                            whileHover={{ scale: 1.1 }}
                            title="Low vulnerabilities"
                          >
                            <CheckCircle2 size={12} /> {counts.LOW}
                          </motion.span>
                        )}
                        {totalVulns === 0 && (
                          <motion.span
                            className="badge no-vulns"
                            whileHover={{ scale: 1.1 }}
                            title="No vulnerabilities found"
                          >
                            ✓ Clean
                          </motion.span>
                        )}
                      </div>
                    </td>

                    <td className="cell-duration">
                      <span className="duration-text">{entry.duration}</span>
                    </td>

                    <td className="cell-actions">
                      {deleteConfirm === entry.timestamp ? (
                        <motion.div
                          className="delete-confirmation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p>Delete this scan?</p>
                          <button
                            className="btn-confirm-delete"
                            onClick={() => handleDeleteEntry(entry.timestamp)}
                          >
                            Yes
                          </button>
                          <button
                            className="btn-cancel-delete"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </button>
                        </motion.div>
                      ) : (
                        <div className="action-buttons">
                          <motion.button
                            className="btn-view"
                            onClick={() => handleViewReport(entry)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="View full report"
                          >
                            <Eye size={16} /> View
                          </motion.button>
                          <motion.button
                            className="btn-delete"
                            onClick={() => setDeleteConfirm(entry.timestamp)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Delete this scan"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="history-footer">
        <p>Showing {history.length} scan{history.length !== 1 ? 's' : ''}</p>
      </div>
    </motion.div>
  )
}
