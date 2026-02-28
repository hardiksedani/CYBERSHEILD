class GrimeUI {
    constructor() {
        this.urlInput = document.getElementById('url-input');
        this.scanBtn = document.getElementById('scan-btn');
        this.progressSection = document.getElementById('progress-section');
        this.progressText = document.getElementById('progress-text');
        this.resultsContainer = document.getElementById('results-container');
        this.historyBtn = document.getElementById('history-btn');
        this.historyModal = document.getElementById('history-modal');
        this.closeModal = document.getElementById('close-modal');
        this.historyList = document.getElementById('history-list');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.scanBtn.addEventListener('click', () => this.startScan());
        this.historyBtn.addEventListener('click', () => this.showHistory());
        this.closeModal.addEventListener('click', () => this.hideHistory());
        this.historyModal.addEventListener('click', (e) => {
            if (e.target === this.historyModal) this.hideHistory();
        });

        // Listen for scan progress updates
        window.electronAPI.onScanProgress((event, message) => {
            this.updateProgress(message);
        });

        // Enter key support
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startScan();
        });
    }

    async startScan() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            alert('URL must start with http:// or https://');
            return;
        }

        this.scanBtn.disabled = true;
        this.scanBtn.textContent = 'Scanning...';
        this.progressSection.classList.remove('hidden');
        this.clearResults();

        try {
            const result = await window.electronAPI.startScan(url);
            
            if (result.success) {
                this.displayResults(result.results);
            } else {
                this.displayError(result.error);
            }
        } catch (error) {
            this.displayError(error.message);
        } finally {
            this.scanBtn.disabled = false;
            this.scanBtn.textContent = 'Start Scan';
            this.progressSection.classList.add('hidden');
        }
    }

    updateProgress(message) {
        this.progressText.textContent = message;
    }

    clearResults() {
        this.resultsContainer.innerHTML = '<div class="no-results"><p>Scanning in progress...</p></div>';
    }

    displayResults(vulnerabilities) {
        if (vulnerabilities.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>✅ No vulnerabilities found!</h3>
                    <p>Your application appears to be secure against the tested vulnerability types.</p>
                </div>
            `;
            return;
        }

        const resultsHTML = vulnerabilities.map(vuln => this.createVulnerabilityCard(vuln)).join('');
        this.resultsContainer.innerHTML = resultsHTML;
    }

    createVulnerabilityCard(vulnerability) {
        return `
            <div class="vulnerability-card">
                <div class="vulnerability-header">
                    <div class="vulnerability-title">${vulnerability.type} Vulnerability</div>
                    <div class="severity ${vulnerability.severity.toLowerCase()}">${vulnerability.severity}</div>
                </div>
                
                <div class="vulnerability-location">
                    📍 Location: ${vulnerability.location}
                </div>
                
                <div class="vulnerability-description">
                    ${vulnerability.description}
                </div>
                
                <div class="vulnerability-section">
                    <h4>Impact</h4>
                    <p>${vulnerability.impact}</p>
                </div>
                
                <div class="vulnerability-section">
                    <h4>How to Fix</h4>
                    <p>${vulnerability.remediation}</p>
                </div>
            </div>
        `;
    }

    displayError(error) {
        this.resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>❌ Scan Error</h3>
                <p>An error occurred during scanning: ${error}</p>
                <p>Please check the URL and try again.</p>
            </div>
        `;
    }

    async showHistory() {
        try {
            const history = await window.electronAPI.getScanHistory();
            this.displayHistory(history);
            this.historyModal.classList.remove('hidden');
        } catch (error) {
            alert('Failed to load scan history: ' + error.message);
        }
    }

    hideHistory() {
        this.historyModal.classList.add('hidden');
    }

    displayHistory(history) {
        if (history.length === 0) {
            this.historyList.innerHTML = '<p>No scan history available.</p>';
            return;
        }

        const historyHTML = history.reverse().map(scan => {
            const date = new Date(scan.timestamp).toLocaleString();
            const vulnCount = scan.vulnerabilities.length;
            const summary = vulnCount === 0 
                ? 'No vulnerabilities found' 
                : `${vulnCount} vulnerability${vulnCount > 1 ? 's' : ''} found`;

            return `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-url">${scan.url}</div>
                        <div class="history-date">${date}</div>
                    </div>
                    <div class="history-summary">${summary}</div>
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = historyHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GrimeUI();
});