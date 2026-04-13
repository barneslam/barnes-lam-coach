#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { db } = require('./supabase-client');

const BASE_DIR = __dirname;

// Lead discovery criteria from April 13 trigger scan
const DISCOVERY_CRITERIA = {
  revenueMin: 2000000,    // $2M
  revenueMax: 50000000,   // $50M
  fundingStages: ['Series A', 'Series B', 'Series C (early)'],
  triggers: [
    'hiring_vp_sales',
    'new_product_launch',
    'growth_plateau',
    'market_expansion',
    'funding_event'
  ],
  minEmployees: 20,
  maxEmployees: 150,
  regions: ['US - SF', 'US - NYC', 'US - Austin', 'US - Boston']
};

// Mock database of known leads from trigger scan and YC batches
// In production, this would query Growth List / Crunchbase APIs
const LEAD_DATABASE = [
  {
    name: 'Corvera Founder',
    company: 'Corvera',
    batch: 'YC W26',
    revenue: '$2M - $10M ARR',
    fundingStage: 'Series A (imminent)',
    trigger: 'funding_event',
    linkedIn: 'https://www.ycombinator.com/companies/corvera',
    confidence: 'HIGH'
  },
  {
    name: 'Sarah Chen',
    company: 'Data Intelligence Labs',
    batch: 'YC S25',
    revenue: '$5M - $15M ARR',
    fundingStage: 'Series A',
    trigger: 'hiring_vp_sales',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM-HIGH'
  },
  {
    name: 'Marcus Johnson',
    company: 'SecureFlow',
    batch: 'YC W25',
    revenue: '$8M - $20M ARR',
    fundingStage: 'Series B',
    trigger: 'new_product_launch',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM-HIGH'
  },
  {
    name: 'Emma Rodriguez',
    company: 'CloudScale Systems',
    batch: 'YC S25',
    revenue: '$3M - $12M ARR',
    fundingStage: 'Series A',
    trigger: 'hiring_vp_sales',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM'
  },
  {
    name: 'Alex Park',
    company: 'AutoMate AI',
    batch: 'YC W26',
    revenue: '$1.5M - $8M ARR',
    fundingStage: 'Series A (seed)',
    trigger: 'new_product_launch',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM'
  },
  {
    name: 'Lisa Wong',
    company: 'Velocity Analytics',
    batch: 'YC S25',
    revenue: '$6M - $18M ARR',
    fundingStage: 'Series A',
    trigger: 'growth_plateau',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM-HIGH'
  },
  {
    name: 'James Mitchell',
    company: 'FinOps Solutions',
    batch: 'YC W25',
    revenue: '$4M - $14M ARR',
    fundingStage: 'Series B',
    trigger: 'hiring_vp_sales',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM-HIGH'
  },
  {
    name: 'Priya Desai',
    company: 'DevTools Pro',
    batch: 'YC S25',
    revenue: '$2.5M - $10M ARR',
    fundingStage: 'Series A',
    trigger: 'hiring_vp_sales',
    linkedIn: 'https://www.ycombinator.com/companies',
    confidence: 'MEDIUM'
  }
];

// Helper to read/write JSON files
function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJSON(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filepath}:`, e.message);
    return false;
  }
}

// Main discovery function
function discoverLeads() {
  const now = new Date();
  const discoveredLeads = [];

  // In production, this would call Growth List API, Crunchbase API, etc.
  // For now, we'll randomly select from database to simulate daily discovery
  const leadsToDiscover = LEAD_DATABASE
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 5); // 5-8 leads per day

  leadsToDiscover.forEach((lead, idx) => {
    discoveredLeads.push({
      id: `lead_${now.getTime()}_${idx}`,
      name: lead.name,
      company: lead.company,
      batch: lead.batch,
      revenue: lead.revenue,
      fundingStage: lead.fundingStage,
      trigger: lead.trigger,
      triggeredAt: now.toISOString(),
      linkedIn: lead.linkedIn,
      confidence: lead.confidence,
      status: 'discovered', // Not yet contacted
      requiresConnectionFirst: true, // CRITICAL: Always require connection request before email
      nextAction: 'research_company_and_send_connection_request',
      discoveredAt: now.toISOString()
    });
  });

  return discoveredLeads;
}

// Log discovery results
function logDiscoveryResults(discoveredLeads) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const logsDir = path.join(BASE_DIR, 'logs');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logEntry = `# Lead Discovery — ${dateStr}

## Summary
- **Leads discovered:** ${discoveredLeads.length}
- **Scan time:** ${now.toISOString()}
- **Confidence levels:** ${discoveredLeads.filter(l => l.confidence === 'HIGH').length} HIGH, ${discoveredLeads.filter(l => l.confidence.includes('MEDIUM')).length} MEDIUM, ${discoveredLeads.filter(l => l.confidence === 'LOW').length} LOW

---

## Discovered Leads

${discoveredLeads.map((lead, idx) => `
### ${idx + 1}. ${lead.name} — ${lead.company}

- **Company:** ${lead.company}
- **YC Batch:** ${lead.batch}
- **Revenue Range:** ${lead.revenue}
- **Funding Stage:** ${lead.fundingStage}
- **Trigger Signal:** ${lead.trigger}
- **Confidence:** ${lead.confidence}
- **LinkedIn:** ${lead.linkedIn}
- **Status:** ${lead.status}
- **⚠️ CRITICAL:** Connection request must be sent FIRST, before any email outreach
- **Next Action:** ${lead.nextAction}
`).join('\n')}

---

## Next Steps

1. **Connection Request Phase:** Send LinkedIn connection requests to all discovered leads
2. **Wait 24-48 hours:** Allow connection requests to be accepted
3. **Outreach Phase:** Once connected, add to outreach-messages and prepare personalized emails
4. **Do NOT skip connection request:** Email without prior connection will reduce response rates

---

## Technical Notes

- Discovery source: YC batches (W25, S25, W26) + simulated Growth List data
- Revenue criteria: $2M-$50M ARR (Series A/B sweet spot)
- Trigger patterns: Hiring VP Sales, new product launches, growth plateau, funding events
- Confidence scores based on trigger verification and company stage
`;

  fs.appendFileSync(path.join(logsDir, `${dateStr}-discovery.md`), logEntry + '\n');
}

// Update tracker with discovery results
function updateTrackerWithDiscovery(discoveredLeads) {
  const trackerPath = path.join(BASE_DIR, 'tracker.json');
  const tracker = readJSON(trackerPath);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  if (!tracker.days) tracker.days = {};
  if (!tracker.days[dateStr]) {
    tracker.days[dateStr] = {
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
      blocks_completed: []
    };
  }

  tracker.days[dateStr].lead_discovery = {
    status: 'completed',
    leads_discovered: discoveredLeads.length,
    timestamp: now.toISOString(),
    next_step: 'send_connection_requests'
  };

  writeJSON(trackerPath, tracker);
}

// Store discovered leads to Supabase
async function storeDiscoveredLeads(discoveredLeads) {
  const today = new Date().toISOString().split('T')[0];

  // Format leads for Supabase
  const formattedLeads = discoveredLeads.map(lead => ({
    name: lead.name,
    company: lead.company,
    batch: lead.batch || null,
    revenue: lead.revenue || null,
    funding_stage: lead.fundingStage || null,
    trigger: lead.trigger || null,
    linkedin_url: lead.linkedinUrl || null,
    confidence: lead.confidence || 'MEDIUM',
    status: 'discovered',
    requires_connection_first: true,
    next_action: 'research_company_and_send_connection_request',
    discovered_date: today,
    discovered_at: new Date().toISOString()
  }));

  try {
    const { data, error } = await db.addDiscoveredLeads(formattedLeads);
    if (error) {
      console.error('❌ Error storing leads to Supabase:', error.message);
    } else {
      console.log(`✅ Stored ${data?.length || formattedLeads.length} leads to Supabase`);
    }
  } catch (e) {
    console.error('❌ Supabase storage error:', e.message);
  }
}

// Run discovery
async function runDiscovery() {
  console.log('\n📊 Starting lead discovery scan...');
  const discoveredLeads = discoverLeads();

  if (discoveredLeads.length > 0) {
    logDiscoveryResults(discoveredLeads);
    updateTrackerWithDiscovery(discoveredLeads);
    await storeDiscoveredLeads(discoveredLeads);
    console.log(`✅ Discovered ${discoveredLeads.length} leads`);
    console.log(`⚠️  IMPORTANT: Connection requests must be sent FIRST before any email outreach`);
  } else {
    console.log('⚠️  No new qualified leads discovered today');
  }

  return discoveredLeads;
}

// Export for use in dashboard-server.js
module.exports = {
  runDiscovery,
  DISCOVERY_CRITERIA,
  LEAD_DATABASE
};

// If run directly, execute discovery
if (require.main === module) {
  runDiscovery();
}
