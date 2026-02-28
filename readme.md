![WhatsApp Image 2026-01-25 at 9 56 59 AM](https://github.com/user-attachments/assets/9c6f8030-4753-46fa-ba09-35d285c8e814)


<div align="center">

![DeGrime](https://img.shields.io/badge/DeGrime-Scan.%20Secure.%20Succeed.-2E3192?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-27.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**Scan. Secure. Succeed.**

*Enterprise-grade automated web application security testing platform*

[Features](#features) • [Installation](#installation) • [Documentation](#documentation) • [Architecture](#architecture) • [License](#license)

</div>

![WhatsApp Image 2026-01-25 at 9 56 48 AM](https://github.com/user-attachments/assets/e44e590c-e7b3-434b-b0b9-3a19709a32d7)
![WhatsApp Image 2026-01-25 at 9 58 10 AM](https://github.com/user-attachments/assets/c222f13a-425e-4f22-85b6-29d77ae18012)
![WhatsApp Image 2026-01-25 at 10 28 23 AM](https://github.com/user-attachments/assets/89e80325-eb3f-4364-bccb-4acbabefa1d1)
![WhatsApp Image 2026-01-25 at 10 28 43 AM](https://github.com/user-attachments/assets/f7acfed8-4336-49c6-bc2a-68e944c96d9e)

---

## Overview

DeGrime is a comprehensive desktop application designed for automated detection and analysis of web application vulnerabilities. Built on a modern technology stack combining Electron, React, and Puppeteer, DeGrime provides security professionals with a powerful, user-friendly interface for conducting thorough security assessments.

The application leverages headless browser automation to perform real-world attack simulations, detecting critical vulnerabilities including Cross-Site Scripting (XSS), SQL Injection, Cross-Site Request Forgery (CSRF), security header misconfigurations, and authentication weaknesses.

---

## Features

### Core Security Testing Capabilities

#### Vulnerability Detection
- **Cross-Site Scripting (XSS)** - Comprehensive testing with multiple payload variations including reflected, stored, and DOM-based XSS detection
- **SQL Injection** - Advanced detection using error-based, boolean-based, union-based, and time-based blind SQL injection techniques
- **Cross-Site Request Forgery (CSRF)** - Automated validation of CSRF token implementation and protection mechanisms
- **Security Header Analysis** - Complete audit of HTTP security headers including CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and X-XSS-Protection
- **CORS Misconfiguration** - Detection of overly permissive Cross-Origin Resource Sharing policies
- **Authentication Vulnerabilities** - Identification of weak authentication patterns, missing rate limiting, and session management issues

#### Advanced Features
- **AI-Powered Analysis** - Integration with artificial intelligence for detailed vulnerability explanations and remediation guidance
- **Verify & Fix Workbench** - Interactive environment for retesting vulnerabilities after implementing fixes
- **Network Scanner** - Local network device discovery and bulk scanning capabilities
- **Parameter Discovery** - Intelligent identification of testable input vectors from forms, URLs, and application interfaces
- **Real-Time Monitoring** - Live progress tracking with detailed logging and status updates
- **Scan History Management** - Persistent storage and retrieval of all scan results with comprehensive reporting

### User Interface
- **Modern Dashboard** - Clean, intuitive interface built with React and Framer Motion
- **Real-Time Visualization** - Live scan progress indicators and animated result displays
- **Developer Console** - Detailed technical logging for advanced users
- **Responsive Design** - Optimized for various screen sizes and resolutions
- **Dark Mode** - Professional dark theme for extended usage sessions

### Platform Support
- **Cross-Platform Compatibility** - Native support for Windows, macOS, and Linux
- **Offline Functionality** - Complete offline operation with optional cloud connectivity
- **Local Storage** - Secure local persistence of scan results and configuration

---

## Installation

### System Requirements

**Minimum Requirements:**
- Operating System: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- RAM: 4GB (8GB recommended)
- Storage: 500MB available space
- Node.js: Version 16.0 or higher
- npm: Version 7.0 or higher

**Recommended Specifications:**
- RAM: 8GB or higher
- Multi-core processor for optimal performance
- SSD storage for faster scan processing

### Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/Guten-Morgen1302/Knowcode-3.0.git
cd degrime
```

2. **Install Dependencies**
```bash
npm install
```

This will install all required dependencies including:
- Electron (Desktop application framework)
- React (User interface library)
- Puppeteer (Headless browser automation)
- Framer Motion (Animation library)
- Zustand (State management)
- Additional supporting libraries

3. **Install Puppeteer Chromium**
```bash
npx puppeteer browsers install chromium
```

4. **Launch Development Environment**
```bash
npm start
```

The application will launch automatically with hot-reload enabled for development.

### Building for Production

**Build for Current Platform:**
```bash
npm run build
```

**Platform-Specific Builds:**
```bash
npm run build:win     # Windows installer (NSIS)
npm run build:mac     # macOS application bundle (DMG)
npm run build:linux   # Linux AppImage
```

---

## Documentation

### Quick Reference

| Document | Purpose |
|----------|---------|
| [README_START_HERE.md](README_START_HERE.md) | Visual overview and getting started guide |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed installation and configuration instructions |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command reference and common operations |
| [ADVANCED_CONFIG.md](ADVANCED_CONFIG.md) | Advanced configuration and customization |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment procedures |
| [DOCS_INDEX.md](DOCS_INDEX.md) | Complete documentation index |

---

## Architecture

### Technology Stack

DeGrime is built on a modern, maintainable architecture:

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  ┌────────────────────────────────────────────┐    │
│  │  React 18 + Vite                           │    │
│  │  - Component-based UI architecture         │    │
│  │  - Framer Motion animations                │    │
│  │  - Zustand state management                │    │
│  │  - Responsive CSS layouts                  │    │
│  └────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ IPC Communication
                       │
┌──────────────────────┴──────────────────────────────┐
│              Application Layer                       │
│  ┌────────────────────────────────────────────┐    │
│  │  Electron Main Process                     │    │
│  │  - Process management                      │    │
│  │  - IPC message handling                    │    │
│  │  - File system operations                  │    │
│  │  - License management                      │    │
│  └────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│              Security Engine Layer                   │
│  ┌────────────────────────────────────────────┐    │
│  │  Puppeteer Scanner Engine                  │    │
│  │  - XSS detection module                    │    │
│  │  - SQL injection testing module            │    │
│  │  - CSRF validation module                  │    │
│  │  - Security header analyzer                │    │
│  │  - Parameter discovery engine              │    │
│  │  - Browser automation controller           │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Usage

### Basic Workflow

1. **Launch Application**
   - Start DeGrime from your applications directory
   - The main interface will display with the scanner input panel

2. **Configure Target**
   - Enter the target URL in the scanner input field
   - Format: `https://example.com` or `http://localhost:3000`
   - Verify network connectivity to the target

3. **Initiate Scan**
   - Click the "Start Scan" button to begin the security assessment
   - Monitor real-time progress in the dashboard
   - Review technical logs in Developer Mode

4. **Analyze Results**
   - Review detected vulnerabilities in the dashboard
   - Click individual findings for detailed analysis
   - Use AI Analyzer for remediation guidance

5. **Verify Fixes**
   - Implement recommended security fixes
   - Use Verify & Fix Workbench to retest specific vulnerabilities
   - Confirm vulnerability resolution

### Advanced Features

#### AI-Powered Analysis
Access detailed vulnerability analysis and remediation guidance:
1. Select a vulnerability from scan results
2. Click "Analyze with AI"
3. Review comprehensive analysis including:
   - Detailed exploit scenarios
   - Step-by-step remediation procedures
   - Code examples and best practices
   - Impact assessment and risk analysis

#### Network Scanning
Perform bulk scans across multiple targets:
1. Access Network Scanner from the main menu
2. Configure network range or import URL list
3. Execute batch scanning operations
4. Export consolidated results

#### Vulnerability Verification
Confirm fix implementation:
1. Implement recommended security controls
2. Select the previously detected vulnerability
3. Initiate targeted retest
4. Verify successful remediation

---

## Security Methodology

### Cross-Site Scripting (XSS) Detection

DeGrime employs comprehensive XSS detection using multiple attack vectors:

**Payload Categories:**
- Script tag injection: `<script>alert(1)</script>`
- Event handler exploitation: `<img src=x onerror=alert(1)>`
- SVG-based attacks: `<svg/onload=alert(1)>`
- Attribute breaking: `"><script>alert(1)</script>`
- JavaScript protocol handlers: `javascript:alert(1)`

**Detection Methodology:**
- Dialog event monitoring (alert, confirm, prompt)
- DOM inspection for unescaped user input
- Script tag injection detection
- Event handler injection verification
- Response content analysis

### SQL Injection Testing

Advanced SQL injection detection using multiple techniques:

**Testing Approaches:**
- Error-based detection (database error message analysis)
- Boolean-based blind SQLi (true/false response differential)
- Union-based injection (UNION SELECT enumeration)
- Time-based blind SQLi (response delay analysis)

**Payload Examples:**
- Basic injection: `' OR '1'='1`
- Comment injection: `' OR '1'='1' --`
- UNION injection: `' UNION SELECT NULL--`
- Stacked queries: `'; DROP TABLE users--`

### Security Header Analysis

Comprehensive evaluation of HTTP security headers:

**Headers Evaluated:**
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## License Tiers

DeGrime offers flexible licensing options:

| Feature | Free | Professional | Enterprise |
|---------|------|--------------|------------|
| Vulnerability Scans | 5 per day | Unlimited | Unlimited |
| XSS Detection | ✓ | ✓ | ✓ |
| SQL Injection Testing | ✓ | ✓ | ✓ |
| Security Headers | ✓ | ✓ | ✓ |
| AI Analysis | ✗ | ✓ | ✓ |
| Network Scanner | ✗ | ✓ | ✓ |
| Verify & Fix Workbench | ✓ | ✓ | ✓ |
| Scan History | Limited | Unlimited | Unlimited |
| Export Reports | ✗ | PDF/JSON | PDF/JSON/XML |
| Bulk Scanning | ✗ | ✓ | ✓ |
| API Access | ✗ | ✗ | ✓ |
| Priority Support | ✗ | ✓ | ✓ |
| Team Collaboration | ✗ | ✗ | ✓ |

---

## Development

### Development Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

```

### Building from Source

```bash
# Clean build directory
npm run clean

# Build React application
npm run build:react

# Build Electron application
npm run build:electron

# Create distributable packages
npm run dist
```

## Contributing

We welcome contributions from the security community. Please follow these guidelines:

### Contribution Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Implement changes following coding standards
4. Write comprehensive tests
5. Update documentation as needed
6. Submit a pull request with detailed description

### Code Standards

- Follow ESLint configuration
- Maintain consistent code formatting
- Write meaningful commit messages
- Include unit tests for new features
- Update documentation for API changes

### Security Disclosures

For security vulnerabilities in DeGrime itself, please email security@degrime.com with details. Do not open public issues for security concerns.

---

## Legal Notice

### Disclaimer

**DeGrime is intended exclusively for authorized security testing.**

- Only scan applications you own or have explicit written permission to test
- Unauthorized security testing may violate local, national, or international laws
- Users are solely responsible for compliance with applicable laws and regulations
- The developers assume no liability for misuse or unauthorized use of this software
- Always obtain proper authorization before conducting security assessments

### Responsible Use

Users of DeGrime must:
- Obtain explicit written permission before scanning any web application
- Comply with all applicable laws and regulations
- Respect privacy and data protection requirements
- Use findings responsibly and ethically
- Report vulnerabilities through proper disclosure channels

---

## Support

### Getting Help

- **Documentation**: [https://docs.degrime.com](https://docs.degrime.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/yourusername/degrime/issues)
- **Email Support**: support@degrime.com
- **Community Forum**: [https://community.degrime.com](https://community.degrime.com)

### Professional Services

For enterprise deployments, custom development, or security consulting:
- Email: enterprise@degrime.com
- Website: [https://degrime.com/enterprise](https://degrime.com/enterprise)

---

## Acknowledgments

DeGrime builds upon the work of numerous open-source projects and security researchers:

- **Puppeteer Team** - Headless browser automation framework
- **Electron Team** - Cross-platform desktop application framework
- **React Team** - User interface library
- **OWASP** - Security testing methodologies and best practices
- **Security Research Community** - Vulnerability research and disclosure

---

## Contributors

<div align="center">

### Team ConsoleLog

<a href="https://github.com/username1"><img src="https://github.com/Guten-Morgen1302.png" width="60px" style="border-radius: 50%;" alt="Contributor 1"/></a>
<a href="https://github.com/username2"><img src="https://github.com/devikabongarde.png" width="60px" style="border-radius: 50%;" alt="Contributor 2"/></a>
<a href="https://github.com/username3"><img src="https://github.com/Rugved-pro.png" width="60px" style="border-radius: 50%;" alt="Contributor 3"/></a>
<a href="https://github.com/username4"><img src="https://github.com/priyali01.png" width="60px" style="border-radius: 50%;" alt="Contributor 4"/></a>

</div>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for complete details.

Copyright (c) 2025 DeGrime - Team ConsoleLog

---

<div align="center">

**DeGrime**

*Scan. Secure. Succeed.*

Built with ❤️ by **Team ConsoleLog**

</div>