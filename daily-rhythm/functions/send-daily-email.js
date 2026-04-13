// Daily summary email via Resend
const https = require('https');

function makeResendRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      reject(new Error('RESEND_API_KEY not set in environment'));
      return;
    }

    const options = {
      hostname: 'api.resend.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

exports.handler = async (event, context) => {
  try {
    // Parse query parameters for metrics
    const params = new URLSearchParams(event.rawQueryString || '');
    const sentYesterday = params.get('sent_yesterday') || '0';
    const newLeads = params.get('new_leads') || '0';
    const plannedToday = params.get('planned_today') || '0';

    const emailContent = `
<h2>GTM Engine Daily Summary</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>Yesterday's Results</h3>
<ul>
  <li><strong>Email outreach sent:</strong> ${sentYesterday}</li>
  <li><strong>New leads discovered:</strong> ${newLeads}</li>
</ul>

<h3>Today's Plan</h3>
<ul>
  <li><strong>Emails scheduled to send:</strong> ${plannedToday}</li>
</ul>

<hr />
<p><small>GTM Engine — Autonomous Daily Rhythm</small></p>
    `.trim();

    const result = await makeResendRequest('POST', '/emails', {
      from: 'GTM Engine <noreply@thestrategypitch.com>',
      to: 'barnes@thestrategypitch.com',
      subject: `GTM Daily Summary — ${new Date().toLocaleDateString()}`,
      html: emailContent
    });

    if (result.status === 200 || result.status === 201) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          email_id: result.body.id
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      return {
        statusCode: result.status,
        body: JSON.stringify({
          success: false,
          error: result.body
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
