import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import './VerificationFlow.css';

export default function VerificationFlow({ domain, verificationId, onVerified, onCancel }) {
    const [copied, setCopied] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    const metaTag = `<meta name="security-verification" content="${verificationId}">`;

    const handleCopy = () => {
        navigator.clipboard.writeText(metaTag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerify = async () => {
        setVerifying(true);
        setError('');

        try {
            const result = await window.electron.verifyDomain(domain, verificationId);
            if (result.success) {
                onVerified();
            } else {
                setError(result.error || 'Verification failed. Please try again.');
                setVerifying(false);
            }
        } catch (err) {
            setError('An error occurred during verification.');
            setVerifying(false);
        }
    };

    return (
        <div className="verification-flow-container">
            <motion.div
                className="verification-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="verification-header-center">
                    <h2>Verify Ownership</h2>
                    <p>
                        To prove you control <span className="highlight-domain">https://{domain}/</span>, add the following META tag to your homepage's <code>&lt;head&gt;</code> section.
                    </p>
                </div>

                <div className="code-card">
                    <div className="code-header-bar">
                        <span className="code-label">&lt;&gt; HTML META Tag</span>
                        <button className="copy-btn-clean" onClick={handleCopy}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="code-content-bar">
                        <code>{metaTag}</code>
                    </div>
                </div>

                <div className="instructions-card">
                    <h3>Instructions:</h3>
                    <ol>
                        <li>Open your website's homepage HTML file</li>
                        <li>Paste the META tag inside the <code>&lt;head&gt;</code> section</li>
                        <li>Deploy or save the changes</li>
                        <li>Click "Verify Ownership" below</li>
                    </ol>
                    <p className="safe-note">
                        <em>The token is safe to be publicly visible — it only proves you have write access to the site.</em>
                    </p>
                </div>

                {error && <div className="verification-error">{error}</div>}

                <div className="verification-action">
                    <button
                        className="btn-verify-main"
                        onClick={handleVerify}
                        disabled={verifying}
                    >
                        {verifying ? 'Verifying...' : 'Verify Ownership'}
                    </button>
                    <button className="btn-cancel-link" onClick={onCancel}>Cancel</button>
                </div>
            </motion.div>
        </div>
    );
}
