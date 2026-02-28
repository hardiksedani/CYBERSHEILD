import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import './VerifyFixWorkbench.css'

export default function VerifyFixWorkbench({ vulnerability, isOpen, onClose, onRetest }) {
  const [isRetesting, setIsRetesting] = useState(false)
  const [retestResult, setRetestResult] = useState(null)
  const [editedPayload, setEditedPayload] = useState(
    vulnerability?.technical_details?.payload || ''
  )

  const handleRetest = async () => {
    setIsRetesting(true)
    setRetestResult(null)

    try {
      const result = await onRetest({
        ...vulnerability,
        technical_details: {
          ...vulnerability.technical_details,
          payload: editedPayload
        }
      })

      setRetestResult(result)
      if (result.fixed) {
        toast.success('✨ Vulnerability Fixed!')
      } else {
        toast.error('⚠️ Vulnerability Still Present')
      }
    } catch (error) {
      toast.error('Retest failed: ' + error.message)
      setRetestResult({ fixed: false, error: error.message })
    } finally {
      setIsRetesting(false)
    }
  }

  if (!isOpen || !vulnerability) return null

  return (
    <motion.div
      className="verify-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="verify-modal"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="verify-header">
          <div>
            <h2>🔍 Verify Payload Sandbox</h2>
            <p className="verify-subtitle">Test if your code changes fixed the {vulnerability.type}</p>
          </div>
          <button className="verify-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="verify-content">
          <div className="workbench-grid">
            {/* Left: Payload Editor */}
            <div className="payload-editor">
              <h3>📝 Test Payload</h3>
              <p className="editor-hint">Edit the malicious payload below to test against your server manually.</p>
              <textarea
                className="payload-textarea"
                value={editedPayload}
                onChange={(e) => setEditedPayload(e.target.value)}
                placeholder="Enter your test payload..."
                disabled={isRetesting}
              />
              <div className="editor-actions">
                <button
                  className="btn-original"
                  onClick={() => setEditedPayload(vulnerability?.technical_details?.payload || '')}
                  disabled={isRetesting}
                >
                  ↶ Reset to Original
                </button>
              </div>
            </div>

            {/* Right: Test Details */}
            <div className="test-details">
              <h3>🎯 Test Target</h3>
              <div className="detail-group">
                <label>URL:</label>
                <code className="detail-value">{vulnerability.url || 'N/A'}</code>
              </div>
              <div className="detail-group">
                <label>Parameter:</label>
                <code className="detail-value">
                  {vulnerability.technical_details?.parameter || 'N/A'}
                </code>
              </div>
              <div className="detail-group">
                <label>Injection Point:</label>
                <code className="detail-value">
                  {vulnerability.technical_details?.selector || 'N/A'}
                </code>
              </div>
              <div className="detail-group">
                <label>Severity:</label>
                <span className={`severity-badge severity-${vulnerability.severity?.toLowerCase()}`}>
                  {vulnerability.severity}
                </span>
              </div>

              {/* Result Display */}
              {retestResult && (
                <motion.div
                  className={`test-result ${retestResult.fixed ? 'success' : 'failed'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {retestResult.fixed ? (
                    <>
                      <CheckCircle size={24} />
                      <h4>✨ Vulnerability Fixed!</h4>
                      <p>The payload no longer triggers the vulnerability.</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={24} />
                      <h4>⚠️ Still Vulnerable</h4>
                      <p>{retestResult.error || 'The vulnerability still exists.'}</p>
                      {retestResult.details && (
                        <details className="result-details">
                          <summary>Show Technical Details</summary>
                          <pre>{JSON.stringify(retestResult.details, null, 2)}</pre>
                        </details>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="explanation-section">
            <h3>📚 Vulnerability Advisor</h3>
            <div className="explanation-box">
              <h4>Why This Happens:</h4>
              <p>{vulnerability.explanation}</p>
            </div>
            <div className="fix-box">
              <h4>Suggested Implementation:</h4>
              <p>Consider applying the following pattern to your code. <em>Note: This tool tests your live environment, it will not modify your code automatically.</em></p>
              <br />
              <p>{vulnerability.fix}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="verify-footer">
          <button
            className="btn-retest"
            onClick={handleRetest}
            disabled={isRetesting || !editedPayload.trim()}
          >
            {isRetesting ? (
              <>
                <Loader size={18} className="spinner" />
                Retesting...
              </>
            ) : (
              <>
                <Play size={18} />
                Run Single Test
              </>
            )}
          </button>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
