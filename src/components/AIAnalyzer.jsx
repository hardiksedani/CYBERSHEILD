import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Brain, Copy, Loader, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './AIAnalyzer.css'

export default function AIAnalyzer({ vulnerability, isOpen, onClose }) {
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)

  useEffect(() => {
    if (isOpen && vulnerability && !analysis) {
      generateAnalysis()
    }
  }, [isOpen, vulnerability])

  const generateAnalysis = async () => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are an expert cybersecurity analyst.
Analyze the following vulnerability:
Type: ${vulnerability.type}
Severity: ${vulnerability.severity || 'Unknown'}

Provide your response STRICTLY as a JSON object with this exact structure (no markdown wrapper, just pure JSON):
{
  "explanation": "Brief explanation of how this vulnerability works and its potential impact.",
  "patchCode": "Code snippet showing how to fix it (before and after if possible).",
  "riskLevel": "Description of the risk level based on its severity.",
  "exploitExample": "A realistic example of an attack payload or exploit scenario.",
  "defenseSteps": ["Step 1", "Step 2", "Step 3"],
  "cveReferences": ["CVE-XXXX-XXXX"],
  "owasp": "Relevant OWASP Category (e.g., A7:2021 - Cross-Site Scripting)"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      let analysisData;
      try {
        // First try direct parse since Gemini is told to return application/json
        analysisData = JSON.parse(responseText);
      } catch (e) {
        // Fallback cleanup if something weird happened
        const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}') + 1;
        if (startIdx >= 0 && endIdx > startIdx) {
          analysisData = JSON.parse(jsonStr.substring(startIdx, endIdx));
        } else {
          throw new Error("Could not extract JSON from AI response.");
        }
      }

      setAnalysis(analysisData)
      toast.success('AI analysis complete!')
    } catch (error) {
      console.error("AI Analysis error:", error);
      setErrorMsg(error.message || 'AI Analysis failed. See console for details.')
      toast.error(error.message || 'AI Analysis failed. See console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  if (!isOpen || !vulnerability) return null

  return (
    <motion.div
      className="ai-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="ai-modal"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-header">
          <div className="header-title">
            <Brain className="ai-icon" />
            <div>
              <h2>🤖 AI Security Analyst</h2>
              <p className="ai-subtitle">Powered by Advanced Security Intelligence</p>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}>✕</button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="ai-loading">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain size={48} />
            </motion.div>
            <h3>Analyzing vulnerability...</h3>
            <p>AI is generating comprehensive security analysis</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="ai-loading" style={{ color: '#ff6b6b' }}>
            <AlertCircle size={48} />
            <h3>Analysis Failed</h3>
            <p style={{ color: '#ff6b6b', maxWidth: '80%', wordWrap: 'break-word' }}>{errorMsg}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !errorMsg && analysis && (
          <div className="ai-content">
            {/* Executive Summary */}
            <section className="ai-section">
              <h3 className="section-title">📊 Executive Summary</h3>
              <div className="summary-box">
                <div className="summary-item">
                  <span className="label">Vulnerability Type:</span>
                  <span className="value">{vulnerability.type}</span>
                </div>
                <div className="summary-item">
                  <span className="label">OWASP Category:</span>
                  <span className="value">{analysis.owasp}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Risk Level:</span>
                  <span className={`value risk-${vulnerability.severity?.toLowerCase()}`}>
                    {analysis.riskLevel}
                  </span>
                </div>
              </div>
            </section>

            {/* Explanation */}
            <section className="ai-section">
              <h3 className="section-title">🔍 How It Works</h3>
              <div className="explanation-box">
                <p>{analysis.explanation}</p>
              </div>
            </section>

            {/* Exploit Example */}
            <section className="ai-section">
              <h3 className="section-title">⚠️ Attack Example</h3>
              <div className="code-block">
                <div className="code-header">
                  <span>Potential Attack Payload</span>
                  <button
                    className={`copy-btn ${copiedSection === 'exploit' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(analysis.exploitExample, 'exploit')}
                  >
                    {copiedSection === 'exploit' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre><code>{analysis.exploitExample}</code></pre>
              </div>
            </section>

            {/* Patch Code */}
            <section className="ai-section">
              <h3 className="section-title">✅ Suggested Implementation</h3>
              <p className="ai-note">The following code is a suggestion. Please manually adapt and apply it to your codebase.</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Suggested Fix</span>
                  <button
                    className={`copy-btn ${copiedSection === 'patch' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(analysis.patchCode, 'patch')}
                  >
                    {copiedSection === 'patch' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre><code>{analysis.patchCode}</code></pre>
              </div>
            </section>

            {/* Defense Steps */}
            <section className="ai-section">
              <h3 className="section-title">🛡️ Defense Strategy</h3>
              <div className="defense-steps">
                {analysis.defenseSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    className="step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <span className="step-number">{idx + 1}</span>
                    <p>{step}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* CVE References */}
            {analysis.cveReferences && analysis.cveReferences.length > 0 && (
              <section className="ai-section">

              </section>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
