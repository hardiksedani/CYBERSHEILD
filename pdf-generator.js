const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateSecurityReport(scanData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // ========== HEADER ==========
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Gradient-like background (cyan accent)
      doc.rect(0, 0, pageWidth, 120).fill('#0f0f1e');
      doc.rect(0, 0, pageWidth, 8).fill('#00d4ff');

      // Logo & Title
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#00d4ff');
      doc.text('🛡️ GRIME', 50, 30);
      doc.fontSize(24).fillColor('#ffffff').text('Security Scanner', 200, 35);

      // Subtitle
      doc.fontSize(12).fillColor('#888888').text('Enterprise-Grade Security Assessment Report', 50, 65);

      // ========== SCAN METADATA ==========
      doc.fontSize(10).fillColor('#888888');
      const scanDate = new Date(scanData.timestamp).toLocaleString();
      doc.text(`Report Generated: ${scanDate}`, 50, 90);
      doc.text(`Target: ${scanData.url || scanData.ip || 'Unknown'}`, 50, 105);

      doc.moveTo(50, 125).lineTo(pageWidth - 50, 125).stroke('#00d4ff');

      // ========== EXECUTIVE SUMMARY ==========
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#00d4ff').text('Executive Summary', 50, 145);

      const vulnerabilities = scanData.vulnerabilities || [];
      const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
      const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length;
      const totalVulnerabilities = vulnerabilities.length;

      // Risk Level Assessment
      let riskLevel = '🟢 LOW RISK';
      let riskColor = '#00e676';
      if (criticalCount > 0) {
        riskLevel = '🔴 CRITICAL RISK';
        riskColor = '#ff006e';
      } else if (highCount > 0) {
        riskLevel = '🟠 HIGH RISK';
        riskColor = '#ff9500';
      } else if (mediumCount > 0) {
        riskLevel = '🟡 MEDIUM RISK';
        riskColor = '#ffd60a';
      }

      doc.fontSize(14).font('Helvetica-Bold').fillColor(riskColor).text(riskLevel, 50, 170);

      // Summary text
      doc.fontSize(11).fillColor('#cccccc');
      doc.text(`A comprehensive security scan identified ${totalVulnerabilities} potential vulnerabilities.`, 50, 195);
      doc.text(`Immediate attention required for ${criticalCount} critical issues.`, 50, 215);

      // ========== VULNERABILITY STATS ==========
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#00d4ff').text('Vulnerability Breakdown', 50, 250);

      // Stats boxes
      const boxWidth = (pageWidth - 140) / 4;
      const boxHeight = 70;
      const boxY = 280;

      drawStatBox(doc, 50, boxY, boxWidth, boxHeight, 'CRITICAL', criticalCount, '#ff006e');
      drawStatBox(doc, 50 + boxWidth + 20, boxY, boxWidth, boxHeight, 'HIGH', highCount, '#ff9500');
      drawStatBox(doc, 50 + (boxWidth + 20) * 2, boxY, boxWidth, boxHeight, 'MEDIUM', mediumCount, '#ffd60a');
      drawStatBox(doc, 50 + (boxWidth + 20) * 3, boxY, boxWidth, boxHeight, 'LOW', lowCount, '#00d4ff');

      // ========== DETAILED FINDINGS ==========
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#00d4ff').text('Detailed Findings', 50, 50);

      let yPos = 90;
      const pageBottomMargin = pageHeight - 60;

      vulnerabilities.forEach((vuln, index) => {
        // Check if we need a new page
        if (yPos > pageBottomMargin) {
          doc.addPage();
          yPos = 50;
        }

        // Vulnerability header
        const severityColor = getSeverityColor(vuln.severity);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text(`${index + 1}. ${vuln.type || vuln.vulnerability || 'Unknown'} [${vuln.severity}]`, 50, yPos);

        // Severity badge
        doc.rect(pageWidth - 130, yPos - 2, 80, 16).fill(severityColor);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
        doc.text(vuln.severity, pageWidth - 125, yPos + 2, { width: 70 });

        yPos += 25;

        // Description
        doc.fontSize(10).fillColor('#cccccc').font('Helvetica');
        const descriptionText = vuln.message || vuln.description || 'No description available';
        const lines = doc.heightOfString(descriptionText, { width: pageWidth - 100 });
        doc.text(descriptionText, 50, yPos, { width: pageWidth - 100 });
        yPos += lines + 10;

        // Details section
        if (vuln.issue || vuln.details) {
          doc.fontSize(9).fillColor('#888888').text('Issue:', 50, yPos);
          yPos += 15;
          const issueText = vuln.issue || vuln.details || '';
          const issueLines = doc.heightOfString(issueText, { width: pageWidth - 100 });
          doc.fontSize(9).fillColor('#aaaaaa').text(issueText, 65, yPos, { width: pageWidth - 115 });
          yPos += issueLines + 10;
        }

        // Fix recommendation
        if (vuln.fix || vuln.remediation) {
          doc.fontSize(9).fillColor('#00e676').font('Helvetica-Bold').text('✓ Fix:', 50, yPos);
          yPos += 15;
          const fixText = vuln.fix || vuln.remediation || '';
          const fixLines = doc.heightOfString(fixText, { width: pageWidth - 100 });
          doc.fontSize(9).fillColor('#00d4ff').font('Helvetica').text(fixText, 65, yPos, { width: pageWidth - 115 });
          yPos += fixLines + 20;
        } else {
          yPos += 10;
        }

        // Separator
        doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).stroke('#333333');
        yPos += 15;
      });

      // ========== RECOMMENDATIONS PAGE ==========
      if (criticalCount > 0 || highCount > 0) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#00d4ff').text('Recommended Actions', 50, 50);

        let recY = 100;
        let priority = 1;

        // Critical recommendations
        if (criticalCount > 0) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#ff006e');
          doc.text(`Priority 1: Address ${criticalCount} Critical Vulnerabilities Immediately`, 50, recY);
          recY += 30;
          doc.fontSize(10).fillColor('#cccccc').font('Helvetica');
          doc.text('Critical vulnerabilities pose an immediate threat to your system. Remediate these issues before deploying to production.', 50, recY, { width: pageWidth - 100 });
          recY += 50;
        }

        // High recommendations
        if (highCount > 0) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#ff9500');
          doc.text(`Priority 2: Resolve ${highCount} High-Risk Issues`, 50, recY);
          recY += 30;
          doc.fontSize(10).fillColor('#cccccc').font('Helvetica');
          doc.text('High-risk vulnerabilities should be addressed within the next security sprint. These issues can lead to significant security breaches.', 50, recY, { width: pageWidth - 100 });
          recY += 50;
        }

        // General recommendations
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#00d4ff');
        doc.text('General Security Practices', 50, recY);
        recY += 25;
        doc.fontSize(10).fillColor('#cccccc').font('Helvetica');
        const recommendations = [
          '• Implement regular security scanning as part of your CI/CD pipeline',
          '• Keep all dependencies and frameworks up to date',
          '• Enforce strong authentication and authorization controls',
          '• Conduct security training for all development team members',
          '• Implement Web Application Firewall (WAF) protection',
          '• Monitor and log all security-relevant events'
        ];
        recommendations.forEach(rec => {
          doc.text(rec, 50, recY, { width: pageWidth - 100 });
          recY += 20;
        });
      }

      // ========== FOOTER ==========
      doc.fontSize(9).fillColor('#666666');
      doc.text('CyberShield Security Scanner - Confidential Security Report', 50, pageHeight - 40, { align: 'center' });
      doc.text(`This report contains confidential security information. Do not distribute without authorization.`, 50, pageHeight - 25, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function drawStatBox(doc, x, y, width, height, label, value, color) {
  // Background
  doc.rect(x, y, width, height).fill('#1a1a2e');

  // Border
  doc.rect(x, y, width, height).stroke(color);

  // Label
  doc.fontSize(9).font('Helvetica-Bold').fillColor(color);
  doc.text(label, x + 10, y + 10, { width: width - 20 });

  // Value
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text(value, x + 10, y + 28, { width: width - 20 });
}

function getSeverityColor(severity) {
  const colors = {
    'CRITICAL': '#ff006e',
    'HIGH': '#ff9500',
    'MEDIUM': '#ffd60a',
    'LOW': '#00d4ff'
  };
  return colors[severity] || '#00d4ff';
}

module.exports = { generateSecurityReport };
