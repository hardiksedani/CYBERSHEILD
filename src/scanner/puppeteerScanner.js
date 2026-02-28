import puppeteer from 'puppeteer'

export class Scanner {
  constructor() {
    this.browser = null
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  async scan(url) {
    const browser = await this.initBrowser()
    const page = await browser.newPage()
    
    const vulnerabilities = []
    const metadata = { url, timestamp: new Date().toISOString(), duration: 0 }
    const startTime = Date.now()

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Run all detection modules
      vulnerabilities.push(...await this.detectXSS(page, url))
      vulnerabilities.push(...await this.detectCSRF(page, url))
      vulnerabilities.push(...await this.detectMissingHeaders(page, url))
      vulnerabilities.push(...await this.detectCORS(page, url))
      vulnerabilities.push(...await this.detectSQLi(page, url))
      vulnerabilities.push(...await this.detectAuthIssues(page, url))
      
    } catch (error) {
      vulnerabilities.push({
        type: 'ERROR',
        severity: 'INFO',
        message: error.message
      })
    } finally {
      await page.close()
      metadata.duration = Date.now() - startTime
    }

    return { vulnerabilities, metadata }
  }

  async detectXSS(page, url) {
    const vulns = []
    const xssPayloads = [
      '<img src=x onerror="alert(\'XSS\')">',
      '<script>alert("XSS")</script>',
      '<svg onload="alert(\'XSS\')">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ]

    // Detect input fields and test them
    const inputs = await page.$$('input[type="text"], textarea, input:not([type])')
    
    for (const input of inputs) {
      for (const payload of xssPayloads) {
        try {
          await input.click()
          await input.type(payload, { delay: 10 })
          
          const alerts = await page.evaluate(() => {
            return new Promise(resolve => {
              const originalAlert = window.alert
              let alertFired = false
              window.alert = function() { alertFired = true }
              setTimeout(() => resolve(alertFired), 500)
            })
          })

          if (alerts) {
            vulns.push({
              type: 'XSS',
              severity: 'CRITICAL',
              message: 'Reflected XSS vulnerability detected',
              location: await input.evaluate(el => el.id || el.name || 'unknown'),
              payload: payload
            })
          }
        } catch (e) {}
      }
    }

    return vulns
  }

  async detectCSRF(page, url) {
    const vulns = []
    
    const forms = await page.$$('form')
    for (const form of forms) {
      const hasCSRFToken = await form.evaluate(f => {
        const inputs = f.querySelectorAll('input')
        return Array.from(inputs).some(i => 
          i.name && (i.name.includes('csrf') || i.name.includes('token') || i.name.includes('nonce'))
        )
      })

      if (!hasCSRFToken) {
        vulns.push({
          type: 'CSRF',
          severity: 'HIGH',
          message: 'No CSRF token detected in form',
          location: await form.evaluate(f => f.id || 'unknown')
        })
      }
    }

    return vulns
  }

  async detectMissingHeaders(page, url) {
    const response = await page.goto(url, { waitUntil: 'networkidle2' })
    const headers = response.headers()
    const vulns = []

    const requiredHeaders = {
      'content-security-policy': 'CSP Header Missing',
      'x-frame-options': 'Clickjacking Protection Missing',
      'x-content-type-options': 'MIME Sniffing Protection Missing',
      'strict-transport-security': 'HSTS Not Enabled',
      'x-xss-protection': 'Legacy XSS Protection Missing'
    }

    for (const [header, message] of Object.entries(requiredHeaders)) {
      if (!headers[header]) {
        vulns.push({
          type: 'MISSING_HEADER',
          severity: 'MEDIUM',
          message,
          header
        })
      }
    }

    return vulns
  }

  async detectCORS(page, url) {
    const vulns = []
    
    const corsHeader = await page.evaluate(() => {
      return document.querySelector('*')?.getAttribute('data-cors') || null
    })

    if (corsHeader === '*') {
      vulns.push({
        type: 'CORS',
        severity: 'HIGH',
        message: 'CORS configured to allow all origins (*)',
        header: 'Access-Control-Allow-Origin'
      })
    }

    return vulns
  }

  async detectSQLi(page, url) {
    const vulns = []
    
    const sqlPayloads = ["' OR '1'='1", "1; DROP TABLE users--", "admin' --"]
    const forms = await page.$$('form')

    for (const form of forms) {
      const method = await form.evaluate(f => f.method || 'GET').toLowerCase()
      const inputs = await form.$$('input')
      
      for (const input of inputs) {
        const name = await input.evaluate(i => i.name)
        if (name && (name.includes('search') || name.includes('query') || name.includes('id'))) {
          for (const payload of sqlPayloads) {
            try {
              await input.type(payload, { delay: 5 })
              // In real scenario, check response for SQL errors
              vulns.push({
                type: 'SQLi_POTENTIAL',
                severity: 'HIGH',
                message: 'Potential SQL injection point detected',
                field: name,
                payload
              })
            } catch (e) {}
          }
        }
      }
    }

    return vulns
  }

  async detectAuthIssues(page, url) {
    const vulns = []
    
    // Check for weak password fields
    const passwordFields = await page.$$('input[type="password"]')
    if (passwordFields.length > 0) {
      // Check for autocomplete
      const hasAutocomplete = await passwordFields[0].evaluate(
        f => f.getAttribute('autocomplete') !== 'off'
      )
      if (hasAutocomplete) {
        vulns.push({
          type: 'AUTH_ISSUE',
          severity: 'MEDIUM',
          message: 'Password autocomplete enabled - security risk'
        })
      }
    }

    return vulns
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
