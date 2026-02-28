"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
  // Scanner APIs
  startScan: (url, mode = "web-scan") => ipcRenderer.invoke("start-scan", url, mode),
  getScanHistory: () => ipcRenderer.invoke("get-scan-history"),
  saveScanResult: (result) => ipcRenderer.invoke("save-scan-result", result),
  clearScanHistory: () => ipcRenderer.invoke("clear-scan-history"),
  deleteScanEntry: (timestamp) => ipcRenderer.invoke("delete-scan-entry", timestamp),
  analyzeVulnerability: (vuln) => ipcRenderer.invoke("analyze-vulnerability", vuln),
  // Network Scanner API
  scanNetwork: (hostname) => ipcRenderer.invoke("scan-network", hostname),
  getLocalIP: () => ipcRenderer.invoke("get-local-ip"),
  scanLocalNetwork: () => ipcRenderer.invoke("scan-local-network"),
  // SSL Scanner API
  scanSSL: (hostname) => ipcRenderer.invoke("scan-ssl", hostname),
  // PDF Report API
  generatePDFReport: (scanData) => ipcRenderer.invoke("generate-pdf-report", scanData),
  // Individual test APIs
  testXSS: (url) => ipcRenderer.invoke("test-xss", url),
  testCSRF: (url) => ipcRenderer.invoke("test-csrf", url),
  testSQLi: (url) => ipcRenderer.invoke("test-sqli", url),
  testHeaders: (url) => ipcRenderer.invoke("test-headers", url),
  testAuth: (url) => ipcRenderer.invoke("test-auth", url),
  // Auth APIs
  checkLicense: () => ipcRenderer.invoke("check-license"),
  setLicense: (license) => ipcRenderer.invoke("set-license", license),
  // History Management API
  updateScanHistory: (action, data) => ipcRenderer.invoke("update-scan-history", action, data),
  // Event listeners
  onScanProgress: (callback) => {
    ipcRenderer.on("scan-progress", (event, data) => {
      callback(data);
    });
  }
});
