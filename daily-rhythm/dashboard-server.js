#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const { runDiscovery } = require('./lead-discovery');
const { db } = require('./supabase-client');

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

  '/api/outreach': async () => {
    try {
      const { data: outreachData, error } = await db.getOutreachMessages();
      if (error) {
        console.error('Error fetching outreach messages:', error);
        return { outreach: [] };
      }
      return { outreach: outreachData || [] };
    } catch (e) {
      console.error('Outreach API error:', e.message);
      return { outreach: [] };
    }
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

  '/api/discovered-leads': async () => {
    try {
      const { data: leads, error } = await db.getDiscoveredLeads();
      if (error) {
        console.error('Error fetching discovered leads:', error);
        return { leads: [], count: 0, lastDiscoveryDate: null };
      }

      // Get the most recent discovery date
      const lastDiscoveryDate = leads && leads.length > 0
        ? leads[0].discovered_date
        : null;

      return {
        leads: leads || [],
        count: leads?.length || 0,
        lastDiscoveryDate
      };
    } catch (e) {
      console.error('Discovered leads API error:', e.message);
      return { leads: [], count: 0, lastDiscoveryDate: null };
    }
  },

  '/api/approval-status': async (body) => {
    try {
      const week = body?.week || 1;
      const { data, error } = await db.getApprovalStatus(week);
      if (error) {
        console.error('Error fetching approval status:', error);
        return { status: 'pending', error: error.message };
      }
      return { status: data?.status || 'pending', data };
    } catch (e) {
      console.error('Approval status API error:', e.message);
      return { status: 'pending', error: e.message };
    }
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
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse POST body
  let body = '';
  if (req.method === 'POST') {
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        await handleRequest(req, res, parsedBody);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Handle GET requests
  await handleRequest(req, res, {});
});

async function handleRequest(req, res, body) {
  // Handle /api/log/:date
  if (req.url.startsWith('/api/log/')) {
    const date = req.url.replace('/api/log/', '');
    serveLog(date, (data) => {
      res.writeHead(200);
      res.end(JSON.stringify(data));
    });
    return;
  }

  // Handle /api/approval/log (POST)
  if (req.url === '/api/approval/log' && req.method === 'POST') {
    try {
      const { week, approved_by, checklist_items, message_count, notes } = body;
      const approvalData = {
        week: week || 1,
        approval_date: new Date().toISOString().split('T')[0],
        approved_at: new Date().toISOString(),
        status: 'approved',
        approved_by: approved_by || 'user',
        checklist_completed: checklist_items || 7,
        checklist_items: 7,
        message_count: message_count || 7,
        approval_notes: notes || '',
        batch_id: `week-${week}-${Date.now()}`,
      };

      const { data, error } = await db.logApproval(approvalData);
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data }));
    } catch (e) {
      console.error('Approval logging error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle other API routes
  if (routes[req.url]) {
    try {
      const data = await routes[req.url]();
      res.writeHead(200);
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('Route error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
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

  // Serve approval dashboard
  if (req.url === '/approval' || req.url === '/approval.html') {
    const approvalContent = readFile(path.join(BASE_DIR, 'approval-dashboard.html'));
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(approvalContent);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Schedule daily lead discovery at 7am
const discoverySchedule = cron.schedule('0 7 * * *', async () => {
  console.log('\n🔔 [7am] Running scheduled lead discovery...');
  try {
    await runDiscovery();
  } catch (e) {
    console.error('Lead discovery error:', e.message);
  }
});

// Also run discovery on startup (in case server restarts after 7am)
(async () => {
  const now = new Date();
  if (now.getHours() >= 7) {
    console.log('⏰ Server started after 7am - running discovery now');
    try {
      await runDiscovery();
    } catch (e) {
      console.error('Lead discovery error:', e.message);
    }
  }
})();

server.listen(PORT, () => {
  console.log(`\n✓ GTM Engine Dashboard running on http://localhost:${PORT}\n`);
  console.log('📊 Lead Discovery: Scheduled daily at 7:00 AM');
  console.log('Open in browser: http://localhost:3001');
  console.log('Press Ctrl+C to stop\n');
});
