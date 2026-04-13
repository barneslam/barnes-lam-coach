#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const { runDiscovery } = require('./lead-discovery');

const PORT = 3001;
const BASE_DIR = __dirname;

// Helper to read JSON files
function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Helper to read markdown files
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    return '';
  }
}

const routes = {
  '/api/today': () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = now.toISOString().split('T')[0];
    return {
      day: days[now.getDay()],
      date: date,
    };
  },

  '/api/config': () => readJSON(path.join(BASE_DIR, 'config.json')),

  '/api/tracker': () => readJSON(path.join(BASE_DIR, 'tracker.json')),

  '/api/targets': () => {
    const trackerData = readJSON(path.join(BASE_DIR, 'tracker.json'));
    const csvContent = readFile(path.join(BASE_DIR, 'assets/tracking-template.csv'));

    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const targets = lines.slice(1).map((line, idx) => {
      const parts = line.split(',');
      return {
        id: idx + 1,
        name: parts[1] || 'TBD',
        business: parts[2] || '',
        signal: parts[3] || '',
        channel: parts[4] || '',
        status: parts[5] ? 'messaged' : 'identified',
        confidence: idx < 2 ? 'HIGH' : 'MEDIUM',
      };
    });

    return { targets };
  },

  '/api/drafts': () => {
    const drafts = [];
    const assetsDir = path.join(BASE_DIR, 'assets');

    if (fs.existsSync(assetsDir)) {
      fs.readdirSync(assetsDir).forEach(file => {
        if (file.endsWith('.md')) {
          // Mark outreach messages as pending
          const status = file.includes('outreach') ? 'pending' : 'approved';
          drafts.push({
            filename: file,
            status: status,
            content: readFile(path.join(assetsDir, file)).substring(0, 500),
          });
        }
      });
    }

    return drafts;
  },

  '/api/logs': () => {
    const logsDir = path.join(BASE_DIR, 'logs');
    if (!fs.existsSync(logsDir)) return [];
    return fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .reverse();
  },

  '/api/offer-doc': () => {
    return {
      content: readFile(path.join(BASE_DIR, 'assets/offer-doc.md')),
    };
  },

  '/api/program': () => readJSON(path.join(BASE_DIR, 'program-8week.json')),

  '/api/outreach': () => {
    const content = readFile(path.join(BASE_DIR, 'assets/outreach-messages-week1.md'));
    const outreach = [];

    // Parse Message sections
    const messageRegex = /## Message \d+: (.+?) — (.+?)\n\n\*\*Signal:\*\* (.+?)\n\*\*Channel:\*\* (.+?)\n\nSubject: (.+?)\n\n([\s\S]+?)(?=---|\Z)/g;
    let match;

    while ((match = messageRegex.exec(content)) !== null) {
      const [, name, business, signal, channel, subject, body] = match;
      outreach.push({
        name: name.trim(),
        business: business.trim(),
        signal: signal.trim(),
        channel: channel.trim(),
        subject: subject.trim(),
        body: body.trim().substring(0, 300),
        full_body: body.trim(),
        send_date: '2026-04-15',
        status: 'scheduled'
      });
    }

    return { outreach };
  },

  '/api/content': () => {
    const contentDir = path.join(BASE_DIR, 'content');
    if (!fs.existsSync(contentDir)) return [];
    return fs.readdirSync(contentDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        filename: f,
        content: readFile(path.join(contentDir, f)),
      }));
  },

  '/api/discovered-leads': () => {
    const discoveredPath = path.join(BASE_DIR, 'discovered-leads.json');
    const discovered = readJSON(discoveredPath);

    // Return leads from all days, most recent first
    const allLeads = [];
    Object.keys(discovered)
      .sort()
      .reverse()
      .forEach(date => {
        if (Array.isArray(discovered[date])) {
          discovered[date].forEach(lead => {
            allLeads.push({
              ...lead,
              discoveredDate: date
            });
          });
        }
      });

    return {
      leads: allLeads,
      count: allLeads.length,
      lastDiscoveryDate: Object.keys(discovered).sort().reverse()[0] || null
    };
  },
};

// Serve log file
function serveLog(date, callback) {
  const logPath = path.join(BASE_DIR, 'logs', `${date}.md`);
  const content = readFile(logPath);
  callback({
    date,
    content: content || `No log found for ${date}`,
  });
}

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle /api/log/:date
  if (req.url.startsWith('/api/log/')) {
    const date = req.url.replace('/api/log/', '');
    serveLog(date, (data) => {
      res.writeHead(200);
      res.end(JSON.stringify(data));
    });
    return;
  }

  // Handle other API routes
  if (routes[req.url]) {
    const data = routes[req.url]();
    res.writeHead(200);
    res.end(JSON.stringify(data));
    return;
  }

  // Serve dashboard.html for root
  if (req.url === '/' || req.url === '/dashboard.html') {
    const dashContent = readFile(path.join(BASE_DIR, 'dashboard.html'));
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(dashContent);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Schedule daily lead discovery at 7am
const discoverySchedule = cron.schedule('0 7 * * *', () => {
  console.log('\n🔔 [7am] Running scheduled lead discovery...');
  try {
    runDiscovery();
  } catch (e) {
    console.error('Lead discovery error:', e.message);
  }
});

// Also run discovery on startup (in case server restarts after 7am)
const now = new Date();
if (now.getHours() >= 7) {
  console.log('⏰ Server started after 7am - running discovery now');
  try {
    runDiscovery();
  } catch (e) {
    console.error('Lead discovery error:', e.message);
  }
}

server.listen(PORT, () => {
  console.log(`\n✓ GTM Engine Dashboard running on http://localhost:${PORT}\n`);
  console.log('📊 Lead Discovery: Scheduled daily at 7:00 AM');
  console.log('Open in browser: http://localhost:3001');
  console.log('Press Ctrl+C to stop\n');
});
