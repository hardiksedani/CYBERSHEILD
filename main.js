const { app, BrowserWindow, ipcMain } = require('electron')

const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const puppeteer = require('puppeteer')
const net = require('net')
const tls = require('tls')
const { spawn } = require('child_process')
const os = require('os')
const { generateSecurityReport } = require('./pdf-generator')

// app.disableHardwareAcceleration() // Removed because of TypeError

let storePath;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function getStore() {
  if (!storePath) storePath = path.join(app.getPath('userData'), 'store.json')
  try {
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, 'utf-8'))
    }
  } catch (e) {
    console.error('Error reading store:', e)
  }
  return { scanHistory: [], license: { tier: 'free', email: '' }, verifications: [] }
}

function saveStore(data) {
  if (!storePath) storePath = path.join(app.getPath('userData'), 'store.json')
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error saving store:', e)
  }
}

let store = null
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 0,
    minHeight: 0,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      webSecurity: false // Disabled to allow external API fetch requests (like Gemini)
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  const startUrl = `file://${path.join(__dirname, 'dist/index.html')}`
  mainWindow.loadURL(startUrl)
  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('ready', () => {
  store = getStore();
  createWindow();
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

function sendProgress(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('scan-progress', message)
  }
  console.log(`[PROGRESS] ${message}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url)
      const client = urlObj.protocol === 'https:' ? https : http

      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Content-Type': options.contentType || 'application/json',
          ...options.headers
        },
        timeout: 10000
      }

      const req = client.request(url, requestOptions, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          })
        })
      })

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      }

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    } catch (e) {
      reject(e)
    }
  })
}

class SecurityScanner {
  constructor() {
    this.testedUrls = new Set()
    this.testedParams = new Set()
  }

  extractLinks(html, baseUrl) {
    const links = []
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1]
        if (href.startsWith('#')) continue

        const fullUrl = new URL(href, baseUrl).href
        const baseHost = new URL(baseUrl).hostname
        const linkHost = new URL(fullUrl).hostname

        if (linkHost === baseHost) {
          links.push(fullUrl)
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }

    return [...new Set(links)].slice(0, 12)
  }

  discoverAPIEndpoints(baseUrl) {
    const urlObj = new URL(baseUrl)
    const base = `${urlObj.protocol}//${urlObj.host}`

    return [
      `${base}/api/users`,
      `${base}/api/products`,
      `${base}/api/search`,
      `${base}/rest/users`,
      `${base}/rest/products`,
      `${base}/rest/products/search`,
      `${base}/rest/user/login`,
      `${base}/api/feedback`,
      `${base}/api/login`,
      `${base}/rest/products/search?q=test`,
      `${base}/api/Users`,
      `${base}/rest/basket/1`,
      `${base}/api/Feedbacks`
    ]
  }

  async scanSQLi(url) {
    sendProgress('Scanning for SQL Injection...')
    const results = []

    const SQL_PAYLOADS = [
      "'",
      "' OR '1'='1",
      "' OR 1=1--",
      "1' AND '1'='1--",
      "admin'--"
    ]

    const dbErrors = [
      'sql syntax', 'sqlite', 'sequelize', 'syntax error', 'sqlstate',
      'mysql_fetch', 'pg_query', 'database error', 'sql error',
      'you have an error in your sql', 'unclosed quotation'
    ]

    try {
      const response = await makeRequest(url)
      const links = this.extractLinks(response.body, url)
      const apiEndpoints = this.discoverAPIEndpoints(url)
      const urlsToTest = [...new Set([url, ...links, ...apiEndpoints])]

      console.log(`[DEBUG] Testing ${urlsToTest.length} URLs for SQLi`)

      for (const testUrl of urlsToTest) {
        if (this.testedUrls.has(testUrl)) continue
        this.testedUrls.add(testUrl)

        try {
          const urlObj = new URL(testUrl)

          if (urlObj.search) {
            const params = Array.from(urlObj.searchParams.keys())

            for (const param of params) {
              const paramKey = `sqli-${testUrl}-${param}`
              if (this.testedParams.has(paramKey)) continue
              this.testedParams.add(paramKey)

              const originalValue = urlObj.searchParams.get(param)

              for (const payload of SQL_PAYLOADS) {
                await delay(150)

                try {
                  urlObj.searchParams.set(param, payload)
                  const testResponse = await makeRequest(urlObj.toString())

                  const bodyLower = testResponse.body.toLowerCase()
                  const errorFound = dbErrors.find(e => bodyLower.includes(e))

                  if (errorFound) {
                    results.push({
                      type: 'SQL Injection',
                      severity: 'CRITICAL',
                      location: `${param} parameter (${testUrl})`,
                      description: `Database error "${errorFound}" with payload "${payload}"`,
                      impact: 'Attackers can read, modify, or delete database data, bypass authentication.',
                      remediation: 'Use parameterized queries. Never concatenate user input into SQL.'
                    })
                    console.log(`[CRITICAL] SQLi: ${param} on ${testUrl}`)
                    break
                  }

                  urlObj.searchParams.set(param, originalValue)
                } catch (e) {
                  // Continue on error
                }
              }
            }
          }

          if (testUrl.includes('/api/') || testUrl.includes('/rest/')) {
            await delay(150)

            for (const payload of SQL_PAYLOADS.slice(0, 2)) {
              try {
                const testResponse = await makeRequest(testUrl, {
                  method: 'POST',
                  body: JSON.stringify({ q: payload, search: payload, email: payload })
                })

                const bodyLower = testResponse.body.toLowerCase()
                const errorFound = dbErrors.find(e => bodyLower.includes(e))

                if (errorFound) {
                  results.push({
                    type: 'SQL Injection (API)',
                    severity: 'CRITICAL',
                    location: `POST to ${testUrl}`,
                    description: `Database error in API endpoint: "${errorFound}"`,
                    impact: 'API endpoint vulnerable to SQL injection attacks.',
                    remediation: 'Use parameterized queries for all database operations.'
                  })
                  console.log(`[CRITICAL] API SQLi: ${testUrl}`)
                  break
                }
              } catch (e) {
                // Continue on error
              }
            }
          }
        } catch (e) {
          // Continue on invalid URL
        }
      }
    } catch (e) {
      console.error('[ERROR] SQLi scan failed:', e.message)
    }

    return results
  }

  async scanXSS(url) {
    sendProgress('Scanning for XSS...')
    const results = []

    const XSS_PAYLOADS = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>',
      '<svg/onload=alert(1)>'
    ]

    try {
      const response = await makeRequest(url)
      const links = this.extractLinks(response.body, url)
      const apiEndpoints = this.discoverAPIEndpoints(url)
      const urlsToTest = [...new Set([url, ...links, ...apiEndpoints])]

      console.log(`[DEBUG] Testing ${urlsToTest.length} URLs for XSS`)

      for (const testUrl of urlsToTest) {
        if (this.testedUrls.has(testUrl)) continue
        this.testedUrls.add(testUrl)

        try {
          const urlObj = new URL(testUrl)

          if (urlObj.search) {
            const params = Array.from(urlObj.searchParams.keys())

            for (const param of params) {
              const paramKey = `xss-${testUrl}-${param}`
              if (this.testedParams.has(paramKey)) continue
              this.testedParams.add(paramKey)

              const originalValue = urlObj.searchParams.get(param)

              for (const payload of XSS_PAYLOADS) {
                await delay(200)

                try {
                  urlObj.searchParams.set(param, payload)
                  const testResponse = await makeRequest(urlObj.toString())

                  console.log(`[DEBUG] Testing XSS: ${param} on ${testUrl.substring(0, 50)}...`)

                  if (testResponse.body.includes(payload)) {
                    results.push({
                      type: 'Reflected XSS',
                      severity: 'CRITICAL',
                      location: `${param} parameter (${testUrl})`,
                      description: `Payload "${payload}" reflected unescaped.`,
                      impact: 'Attackers can inject JavaScript to steal cookies or hijack sessions.',
                      remediation: 'Implement output encoding. Use Content Security Policy.'
                    })
                    console.log(`[CRITICAL] XSS: ${param} on ${testUrl}`)
                    break
                  }

                  const body = testResponse.body.toLowerCase()
                  const simplifiedPayload = payload.toLowerCase().replace(/[<>"']/g, '')

                  if (body.includes(simplifiedPayload) && (body.includes('script') || body.includes('onerror'))) {
                    results.push({
                      type: 'Potential XSS',
                      severity: 'HIGH',
                      location: `${param} parameter (${testUrl})`,
                      description: `Input reflected with partial sanitization.`,
                      impact: 'May be exploitable with alternative payloads.',
                      remediation: 'Implement proper output encoding and CSP.'
                    })
                    console.log(`[HIGH] Potential XSS: ${param}`)
                    break
                  }

                  urlObj.searchParams.set(param, originalValue)
                } catch (e) {
                  // Continue on error
                }
              }
            }
          }

          if (testUrl.includes('/api/') || testUrl.includes('/rest/')) {
            for (const payload of XSS_PAYLOADS.slice(0, 2)) {
              await delay(200)

              try {
                const testResponse = await makeRequest(testUrl, {
                  method: 'POST',
                  body: JSON.stringify({ comment: payload, name: payload, message: payload, q: payload })
                })

                if (testResponse.body.includes(payload)) {
                  results.push({
                    type: 'XSS in API Response',
                    severity: 'HIGH',
                    location: `API endpoint ${testUrl}`,
                    description: `API reflects unsanitized input.`,
                    impact: 'If JSON is rendered in HTML without escaping, XSS is possible.',
                    remediation: 'Sanitize all user input. Apply output encoding.'
                  })
                  console.log(`[HIGH] API XSS: ${testUrl}`)
                  break
                }
              } catch (e) {
                // Continue on error
              }
            }
          }
        } catch (e) {
          // Continue on invalid URL
        }
      }
    } catch (e) {
      console.error('[ERROR] XSS scan failed:', e.message)
    }

    return results
  }

  async scanHeaders(url) {
    sendProgress('Checking security headers...')
    const results = []

    try {
      const response = await makeRequest(url)
      const headers = response.headers

      console.log('[DEBUG] Headers:', Object.keys(headers))

      if (!headers['content-security-policy']) {
        results.push({
          type: 'Missing Security Header',
          severity: 'MEDIUM',
          location: 'HTTP Response Headers',
          description: 'Content-Security-Policy (CSP) not set.',
          impact: 'Site is more vulnerable to XSS attacks.',
          remediation: 'Add CSP: "Content-Security-Policy: default-src \'self\';"'
        })
      }

      if (!headers['x-frame-options']) {
        results.push({
          type: 'Missing Security Header',
          severity: 'MEDIUM',
          location: 'HTTP Response Headers',
          description: 'X-Frame-Options not set.',
          impact: 'Vulnerable to clickjacking attacks.',
          remediation: 'Set to "DENY" or "SAMEORIGIN"'
        })
      }

      if (!headers['strict-transport-security'] && url.startsWith('https://')) {
        results.push({
          type: 'Missing Security Header',
          severity: 'MEDIUM',
          location: 'HTTP Response Headers',
          description: 'HSTS not set.',
          impact: 'Users might access over insecure HTTP.',
          remediation: 'Add: "Strict-Transport-Security: max-age=31536000"'
        })
      }

      if (!headers['x-content-type-options']) {
        results.push({
          type: 'Missing Security Header',
          severity: 'LOW',
          location: 'HTTP Response Headers',
          description: 'X-Content-Type-Options not set.',
          impact: 'Browsers might MIME-sniff malicious content.',
          remediation: 'Set to "nosniff"'
        })
      }

      return results
    } catch (e) {
      console.error('[ERROR] Header scan failed:', e.message)
      return []
    }
  }

  async scanCSRF(url) {
    sendProgress('Checking CSRF protection...')
    const results = []

    try {
      const response = await makeRequest(url)
      const formRegex = /<form[^>]*method=["']post["'][^>]*>/gi
      const forms = response.body.match(formRegex) || []

      console.log(`[DEBUG] Found ${forms.length} POST forms`)

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i]
        const actionMatch = form.match(/action=["']([^"']+)["']/)
        const action = actionMatch ? actionMatch[1] : 'inline'

        const formStart = response.body.indexOf(form)
        const formEnd = response.body.indexOf('</form>', formStart)
        const formContent = response.body.substring(formStart, formEnd)

        const hasToken = /name=["'](csrf|token|_token|authenticity|nonce)/i.test(formContent)

        if (!hasToken) {
          results.push({
            type: 'CSRF Vulnerability',
            severity: 'HIGH',
            location: `POST form (action: ${action})`,
            description: 'Form lacks CSRF token.',
            impact: 'Attackers can trick users into unauthorized requests.',
            remediation: 'Implement CSRF tokens in all state-changing forms.'
          })
        }
      }

      return results
    } catch (e) {
      console.error('[ERROR] CSRF scan failed:', e.message)
      return []
    }
  }

  async scan(url) {
    const startTime = Date.now()
    this.testedUrls.clear()
    this.testedParams.clear()

    try {
      new URL(url)
      sendProgress('Starting security scan...')

      const allVulns = []

      try {
        const headers = await this.scanHeaders(url)
        allVulns.push(...headers)
        console.log(`[RESULT] ${headers.length} header issues`)
      } catch (e) {
        console.error('Header error:', e)
      }

      try {
        const sqli = await this.scanSQLi(url)
        allVulns.push(...sqli)
        console.log(`[RESULT] ${sqli.length} SQL injections`)
      } catch (e) {
        console.error('SQLi error:', e)
      }

      try {
        const xss = await this.scanXSS(url)
        allVulns.push(...xss)
        console.log(`[RESULT] ${xss.length} XSS vulnerabilities`)
      } catch (e) {
        console.error('XSS error:', e)
      }

      try {
        const csrf = await this.scanCSRF(url)
        allVulns.push(...csrf)
        console.log(`[RESULT] ${csrf.length} CSRF issues`)
      } catch (e) {
        console.error('CSRF error:', e)
      }

      const duration = Math.round((Date.now() - startTime) / 1000)
      sendProgress(`Scan complete! Found ${allVulns.length} vulnerabilities in ${duration}s`)

      const history = store.scanHistory || []
      history.unshift({
        url,
        timestamp: new Date().toISOString(),
        vulnerabilities: allVulns,
        duration: `${duration}s`
      })
      store.scanHistory = history.slice(0, 50)
      saveStore(store)

      return allVulns
    } catch (error) {
      console.error('Scan failed:', error)
      throw error
    }
  }
}

const scanner = new SecurityScanner()

ipcMain.handle('start-scan', async (event, url) => {
  try {
    sendProgress('Initializing...')
    const results = await scanner.scan(url)
    return { success: true, results }
  } catch (error) {
    console.error('Scan error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-scan-history', () => store.scanHistory || [])

ipcMain.handle('save-scan-result', (event, result) => {
  const history = store.scanHistory || []
  history.unshift(result)
  store.scanHistory = history.slice(0, 100)
  saveStore(store)
  return true
})

ipcMain.handle('analyze-vulnerability', async (event, vuln) => ({
  vulnerability: vuln.type,
  severity: vuln.severity,
  explanation: vuln.explanation || vuln.description,
  fix: vuln.fix || vuln.remediation
}))

// ========== META TAG VERIFICATION ==========
const crypto = require('crypto');

ipcMain.handle('check-verification', (event, domain) => {
  const verifications = store.verifications || [];
  const entry = verifications.find(v => v.domain === domain);
  return entry ? entry.is_verified : false;
});

ipcMain.handle('generate-verification', (event, domain) => {
  let verifications = store.verifications || [];
  let entry = verifications.find(v => v.domain === domain);

  if (!entry) {
    entry = {
      domain,
      verification_id: `secscan-verify-${crypto.randomBytes(16).toString('hex')}`,
      is_verified: false,
      created_at: new Date().toISOString()
    };
    verifications.push(entry);
    store.verifications = verifications;
    saveStore(store);
  }

  return entry.verification_id;
});

ipcMain.handle('verify-domain', async (event, domain, verificationId) => {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    // First, try a lightweight raw HTTP request
    try {
      const response = await makeRequest(url);
      const html = response.body;

      // Checking raw HTML
      const metaRegex = new RegExp(`<meta[^>]*name=["']secscan-verification["'][^>]*content=["']${verificationId}["'][^>]*>`, 'i');
      const metaRegexReverse = new RegExp(`<meta[^>]*content=["']${verificationId}["'][^>]*name=["']secscan-verification["'][^>]*>`, 'i');

      if (metaRegex.test(html) || metaRegexReverse.test(html)) {
        return handleSuccessfulVerification(domain);
      }
    } catch (e) {
      console.log('Lightweight fetch failed or no tag found, falling back to Puppeteer...', e.message);
    }

    // Fallback: Use Puppeteer to handle GitHub repos, React SPA hydration, etc.
    let browser = null;
    try {
      browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();

      // Navigate and wait for network idle to ensure SPAs load
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

      // Extract all meta tags from the fully rendered DOM
      const tagExists = await page.evaluate((vid) => {
        const metas = document.getElementsByTagName('meta');
        for (let i = 0; i < metas.length; i++) {
          if (metas[i].getAttribute('name') === 'secscan-verification' &&
            metas[i].getAttribute('content') === vid) {
            return true;
          }
        }

        // Specially check inside body or code blocks for GitHub repos
        // or cases where the HTML is rendered as text on the page
        const htmlText = document.documentElement.outerHTML || '';
        if (htmlText.includes(vid)) {
          return true;
        }

        return false;
      }, verificationId);

      await browser.close();

      if (tagExists) {
        return handleSuccessfulVerification(domain);
      }

    } catch (puppeteerError) {
      if (browser) await browser.close();
      console.error('Puppeteer verification failed:', puppeteerError);
    }

    return { success: false, error: 'META tag not found. Please make sure you added it inside the <head> section and your website is publicly accessible.' };
  } catch (error) {
    return { success: false, error: `Failed to fetch website: ${error.message}` };
  }
});

function handleSuccessfulVerification(domain) {
  let verifications = store.verifications || [];
  const entryIndex = verifications.findIndex(v => v.domain === domain);

  if (entryIndex !== -1) {
    verifications[entryIndex].is_verified = true;
    verifications[entryIndex].verified_at = new Date().toISOString();
    store.verifications = verifications;
    saveStore(store);
    return { success: true };
  }
  return { success: false, error: 'Domain not found in verification queue.' };
}

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

// ========== SSL/TLS SCANNER ENGINE ==========
async function scanSSL(hostname) {
  return new Promise((resolve) => {
    const options = {
      host: hostname,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 5000
    }

    const req = https.request(hostname, options, (res) => {
      const cert = res.socket.getPeerCertificate(true)
      res.resume()
      res.on('end', () => {
        const sslReport = parseSSLCertificate(cert, hostname)
        resolve(sslReport)
      })
    })

    req.on('error', (error) => {
      resolve({
        valid: false,
        error: error.message,
        severity: 'HIGH',
        hostname,
        timestamp: new Date().toISOString()
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        valid: false,
        error: 'SSL scan timeout',
        severity: 'MEDIUM',
        hostname,
        timestamp: new Date().toISOString()
      })
    })

    req.end()
  })
}

function parseSSLCertificate(cert, hostname) {
  if (!cert || Object.keys(cert).length === 0) {
    return {
      valid: false,
      error: 'Unable to retrieve certificate',
      severity: 'HIGH',
      hostname,
      timestamp: new Date().toISOString()
    }
  }

  const validFrom = new Date(cert.valid_from)
  const validTo = new Date(cert.valid_to)
  const now = new Date()
  const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24))
  const isExpired = now > validTo
  const expiringSoon = daysRemaining <= 7 && daysRemaining > 0
  const isSelfSigned = cert.issuer && cert.subject &&
    JSON.stringify(cert.issuer) === JSON.stringify(cert.subject)

  let severity = 'LOW'
  let fix = ''

  if (isExpired) {
    severity = 'CRITICAL'
    fix = 'Certificate has expired. Renew immediately from your certificate authority.'
  } else if (expiringSoon) {
    severity = 'HIGH'
    fix = `Certificate expires in ${daysRemaining} days. Renew from your certificate authority.`
  } else if (isSelfSigned) {
    severity = 'MEDIUM'
    fix = 'Self-signed certificate detected. Use a certificate from a trusted CA for production.'
  }

  const subjectAlt = cert.subjectaltname || ''
  const domainMatches = checkDomainMatch(hostname, cert.subject?.CN, subjectAlt)

  return {
    valid: !isExpired,
    hostname,
    subject: cert.subject?.CN || 'Unknown',
    issuer: cert.issuer?.O || 'Unknown',
    isSelfSigned,
    validFrom: cert.valid_from,
    validTo: cert.valid_to,
    daysRemaining: Math.max(daysRemaining, 0),
    isExpiring: expiringSoon,
    isExpired,
    domainMatches,
    subjectAltNames: subjectAlt,
    severity,
    fix,
    fingerprint: cert.fingerprint,
    timestamp: new Date().toISOString()
  }
}

function checkDomainMatch(hostname, cn, san) {
  const normalizeHost = (h) => h.toLowerCase().replace('*.', '')
  const checkPattern = (pattern, domain) => {
    if (pattern.startsWith('*.')) {
      return domain.endsWith(pattern.substring(1))
    }
    return pattern.toLowerCase() === domain.toLowerCase()
  }

  if (cn && checkPattern(cn, hostname)) return true
  if (san) {
    return san.split(', ').some(alt =>
      checkPattern(alt.replace('DNS:', ''), hostname)
    )
  }
  return false
}

// ========== NETWORK SCANNER ENGINE ==========
const TOP_CRITICAL_PORTS = [
  { port: 21, service: 'ftp' },
  { port: 22, service: 'ssh' },
  { port: 23, service: 'telnet' },
  { port: 25, service: 'smtp' },
  { port: 53, service: 'dns' },
  { port: 80, service: 'http' },
  { port: 110, service: 'pop3' },
  { port: 143, service: 'imap' },
  { port: 443, service: 'https' },
  { port: 445, service: 'smb' },
  { port: 3306, service: 'mysql' },
  { port: 3389, service: 'rdp' },
  { port: 5432, service: 'postgresql' },
  { port: 5984, service: 'couchdb' },
  { port: 6379, service: 'redis' },
  { port: 8080, service: 'http-alt' },
  { port: 8443, service: 'https-alt' },
  { port: 27017, service: 'mongodb' },
  { port: 9200, service: 'elasticsearch' },
  { port: 9300, service: 'elasticsearch-node' }
]

async function scanNetwork(hostname) {
  try {
    const openPorts = []

    const scanPromises = TOP_CRITICAL_PORTS.map(portObj => {
      return checkPort(hostname, portObj.port, 2000)
        .then(status => {
          if (status === 'open') {
            return { port: portObj.port, service: portObj.service, status: 'open' }
          }
          return null
        })
        .catch(() => null)
    })

    const results = await Promise.all(scanPromises)
    const discoveredPorts = results.filter(result => result !== null)
    discoveredPorts.sort((a, b) => a.port - b.port)

    const severityCount = calculateSeverity(discoveredPorts)
    const issues = getPortVulnerabilities(discoveredPorts)

    return {
      hostname,
      ip: hostname,
      status: discoveredPorts.length > 0 ? 'online' : 'offline',
      openPorts: discoveredPorts,
      services: discoveredPorts.map(p => p.service),
      issueCount: severityCount.total,
      vulnerabilities: {
        CRITICAL: severityCount.CRITICAL,
        HIGH: severityCount.HIGH,
        MEDIUM: severityCount.MEDIUM,
        LOW: severityCount.LOW
      },
      issues: issues,
      scanTime: new Date().toISOString()
    }
  } catch (error) {
    console.error('Network scan error:', error)
    return {
      hostname,
      ip: hostname,
      status: 'offline',
      openPorts: [],
      services: [],
      issueCount: 0,
      vulnerabilities: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      scanTime: new Date().toISOString()
    }
  }
}

function calculateSeverity(openPorts) {
  const criticalServices = ['mysql', 'postgresql', 'mongodb', 'redis', 'couchdb', 'elasticsearch', 'ssh', 'smb', 'rdp']
  const highServices = ['http', 'https', 'ftp', 'telnet', 'pop3', 'imap', 'smtp']
  const mediumServices = ['dns', 'http-alt', 'https-alt']

  let CRITICAL = 0, HIGH = 0, MEDIUM = 0, LOW = 0

  openPorts.forEach(({ service }) => {
    if (criticalServices.includes(service)) {
      CRITICAL++
    } else if (highServices.includes(service)) {
      HIGH++
    } else if (mediumServices.includes(service)) {
      MEDIUM++
    } else {
      LOW++
    }
  })

  return {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW,
    total: CRITICAL + HIGH + MEDIUM + LOW
  }
}

function checkPort(hostname, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let isResolved = false

    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        socket.destroy()
        resolve('closed')
      }
    }, timeout)

    socket.connect(port, hostname, () => {
      if (!isResolved) {
        isResolved = true
        clearTimeout(timeoutId)
        socket.destroy()
        resolve('open')
      }
    })

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true
        clearTimeout(timeoutId)
        resolve('closed')
      }
    })

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true
        clearTimeout(timeoutId)
        socket.destroy()
        resolve('filtered')
      }
    })
  })
}

function getPortVulnerabilities(openPorts) {
  const vulnerabilityMap = {
    21: { severity: 'HIGH', issue: 'FTP enabled (unencrypted)', explanation: 'FTP transmits login credentials in plaintext.', fix: 'Disable FTP. Use SFTP instead.' },
    22: { severity: 'MEDIUM', issue: 'SSH accessible', explanation: 'SSH port is open. Monitor for brute-force attacks.', fix: 'Change SSH port, disable password auth, use key-based auth.' },
    23: { severity: 'CRITICAL', issue: 'Telnet enabled', explanation: 'Telnet transmits all data in plaintext.', fix: 'Disable Telnet immediately. Use SSH.' },
    25: { severity: 'MEDIUM', issue: 'SMTP accessible', explanation: 'Open SMTP can be abused for spam relay.', fix: 'Restrict SMTP to trusted IPs, require authentication.' },
    53: { severity: 'MEDIUM', issue: 'DNS resolver exposed', explanation: 'Can be exploited for DNS amplification attacks.', fix: 'Restrict DNS to trusted networks.' },
    80: { severity: 'HIGH', issue: 'HTTP unencrypted', explanation: 'HTTP transmits data in plaintext.', fix: 'Use HTTPS only, enforce HSTS headers.' },
    110: { severity: 'HIGH', issue: 'POP3 unencrypted', explanation: 'POP3 sends passwords in plaintext.', fix: 'Use POP3S on port 995.' },
    143: { severity: 'HIGH', issue: 'IMAP unencrypted', explanation: 'IMAP without encryption exposes credentials.', fix: 'Use IMAPS on port 993.' },
    443: { severity: 'LOW', issue: 'HTTPS accessible', explanation: 'HTTPS is secure. Monitor certificate validity.', fix: 'Keep SSL certificate updated.' },
    445: { severity: 'CRITICAL', issue: 'SMB exposed', explanation: 'Windows file sharing exposed to network.', fix: 'Restrict SMB via firewall, disable SMB v1.' },
    3306: { severity: 'CRITICAL', issue: 'MySQL exposed', explanation: 'Database directly accessible without protection.', fix: 'Restrict MySQL to localhost only.' },
    3389: { severity: 'CRITICAL', issue: 'RDP exposed', explanation: 'Remote Desktop exposed to internet attacks.', fix: 'Restrict RDP to VPN only.' },
    5432: { severity: 'CRITICAL', issue: 'PostgreSQL exposed', explanation: 'Database vulnerable to brute-force attacks.', fix: 'Bind PostgreSQL to localhost only.' },
    5984: { severity: 'CRITICAL', issue: 'CouchDB exposed', explanation: 'CouchDB often runs without authentication.', fix: 'Enable authentication, restrict to localhost.' },
    6379: { severity: 'CRITICAL', issue: 'Redis exposed', explanation: 'Redis unencrypted and typically unauth.', fix: 'Restrict to localhost, enable requirepass.' },
    8080: { severity: 'MEDIUM', issue: 'HTTP alt exposed', explanation: 'HTTP on alternate port, unencrypted.', fix: 'Use HTTPS, restrict if development server.' },
    8443: { severity: 'LOW', issue: 'HTTPS alt exposed', explanation: 'HTTPS on non-standard port.', fix: 'Monitor certificate validity.' },
    27017: { severity: 'CRITICAL', issue: 'MongoDB exposed', explanation: 'MongoDB often has no authentication enabled.', fix: 'Enable authentication, restrict IP access.' },
    9200: { severity: 'CRITICAL', issue: 'Elasticsearch exposed', explanation: 'No authentication by default, full data access.', fix: 'Restrict to localhost, enable X-Pack.' },
    9300: { severity: 'CRITICAL', issue: 'Elasticsearch nodes exposed', explanation: 'Inter-node communication vulnerable.', fix: 'Restrict to trusted nodes only.' }
  }

  const issues = []
  for (const port of openPorts) {
    const vulnInfo = vulnerabilityMap[port.port]
    if (vulnInfo) {
      issues.push({
        port: port.port,
        service: port.service,
        severity: vulnInfo.severity,
        issue: vulnInfo.issue,
        explanation: vulnInfo.explanation,
        fix: vulnInfo.fix
      })
    }
  }

  return issues
}

ipcMain.handle('scan-ssl', async (event, hostname) => {
  try {
    const sslReport = await scanSSL(hostname)
    return { success: true, data: sslReport }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-local-ip', () => {
  try {
    const localIP = getLocalIP()
    return { success: true, data: { ip: localIP } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('scan-local-network', async (event) => {
  try {
    const localIP = getLocalIP()
    const ports = await scanNetwork(localIP)
    return { success: true, data: { ...ports, timestamp: new Date().toISOString() } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('check-license', () => store.license || { tier: 'free', email: '' })

ipcMain.handle('set-license', (event, license) => {
  store.license = license
  saveStore(store)
  return true
})

ipcMain.handle('generate-pdf-report', async (event, scanData) => {
  try {
    const fileName = `CyberShield_Security_Report_${Date.now()}.pdf`
    const downloadsPath = path.join(app.getPath('downloads'), fileName)

    await generateSecurityReport(scanData, downloadsPath)

    return {
      success: true,
      path: downloadsPath,
      fileName: fileName
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})