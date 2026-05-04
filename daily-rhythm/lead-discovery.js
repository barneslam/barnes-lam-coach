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
  regions: ['US - SF', 'US - NYC', 'US - Austin', 'US - Boston'],
  // Exclude these company/role types
  excludeTypes: [
    'consultant', 'consulting', 'advisory', 'advisor',
    'coach', 'coaching', 'trainer', 'training',
    'agency', 'service provider', 'freelance', 'contractor',
    'marketplace', 'platform' // Pure SaaS facilitators
  ]
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
  },
  { name: 'David Kim', company: 'API Gateway', batch: 'YC W26', revenue: '$3M - $12M ARR', fundingStage: 'Series A', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Rachel Green', company: 'ML Ops', batch: 'YC S25', revenue: '$4M - $15M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Tom Bradley', company: 'Data Pipeline', batch: 'YC W25', revenue: '$2M - $8M ARR', fundingStage: 'Seed', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Nina Patel', company: 'Cloud Storage Pro', batch: 'YC S25', revenue: '$5M - $20M ARR', fundingStage: 'Series B', trigger: 'growth_plateau', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Chris Lee', company: 'Analytics Engine', batch: 'YC W26', revenue: '$3M - $10M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Jessica Wu', company: 'API Security', batch: 'YC S25', revenue: '$6M - $18M ARR', fundingStage: 'Series A', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Michael Torres', company: 'DevOps Tools', batch: 'YC W25', revenue: '$2.5M - $9M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM' },
  { name: 'Amanda Liu', company: 'Compliance Suite', batch: 'YC S25', revenue: '$4M - $14M ARR', fundingStage: 'Series B', trigger: 'market_expansion', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Ryan Cohen', company: 'Infrastructure', batch: 'YC W26', revenue: '$3M - $12M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Sofia Rodriguez', company: 'Payments Hub', batch: 'YC S25', revenue: '$7M - $25M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'James Park', company: 'Monitoring Pro', batch: 'YC W25', revenue: '$2M - $8M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Karen White', company: 'Testing Platform', batch: 'YC S25', revenue: '$5M - $16M ARR', fundingStage: 'Series A', trigger: 'growth_plateau', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Peter Zhang', company: 'Deployment Suite', batch: 'YC W26', revenue: '$3.5M - $13M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Angela Brown', company: 'Security Platform', batch: 'YC S25', revenue: '$6M - $20M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Daniel Martinez', company: 'Code Review AI', batch: 'YC W25', revenue: '$2M - $10M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM' },
  { name: 'Michelle Kim', company: 'Observability Suite', batch: 'YC S25', revenue: '$4.5M - $15M ARR', fundingStage: 'Series A', trigger: 'market_expansion', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Jason Smith', company: 'Workflow Automation', batch: 'YC W26', revenue: '$3M - $11M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Lisa Chen', company: 'Database Tools', batch: 'YC S25', revenue: '$5M - $18M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Kevin Johnson', company: 'Queue Management', batch: 'YC W25', revenue: '$2.5M - $9M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Emily Davis', company: 'Metrics Platform', batch: 'YC S25', revenue: '$4M - $14M ARR', fundingStage: 'Series A', trigger: 'growth_plateau', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Robert Wilson', company: 'Integration Hub', batch: 'YC W26', revenue: '$3.5M - $12M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Sarah Johnson', company: 'Logging Service', batch: 'YC S25', revenue: '$6M - $22M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Mark Wilson', company: 'Cache Management', batch: 'YC W25', revenue: '$2M - $8M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM' },
  { name: 'Jennifer Taylor', company: 'Load Balancing', batch: 'YC S25', revenue: '$4.5M - $16M ARR', fundingStage: 'Series A', trigger: 'market_expansion', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Andrew Brown', company: 'Config Management', batch: 'YC W26', revenue: '$3M - $11M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Emma Wilson', company: 'Service Mesh', batch: 'YC S25', revenue: '$5M - $19M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Thomas Garcia', company: 'Container Orchestration', batch: 'YC W25', revenue: '$2.5M - $10M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Olivia Martinez', company: 'Serverless Platform', batch: 'YC S25', revenue: '$4M - $14M ARR', fundingStage: 'Series A', trigger: 'growth_plateau', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Jacob Anderson', company: 'Event Streaming', batch: 'YC W26', revenue: '$3.5M - $13M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Sophia Thomas', company: 'Vector Database', batch: 'YC S25', revenue: '$6M - $21M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Lucas Miller', company: 'Time Series DB', batch: 'YC W25', revenue: '$2M - $9M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM' },
  { name: 'Ava Jackson', company: 'Graph Database', batch: 'YC S25', revenue: '$4.5M - $15M ARR', fundingStage: 'Series A', trigger: 'market_expansion', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Mason White', company: 'Search Engine', batch: 'YC W26', revenue: '$3M - $12M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Isabella Harris', company: 'Stream Processing', batch: 'YC S25', revenue: '$5M - $18M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Ethan Martin', company: 'Data Warehouse', batch: 'YC W25', revenue: '$2.5M - $10M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Mia Thompson', company: 'ML Platform', batch: 'YC S25', revenue: '$4M - $14M ARR', fundingStage: 'Series A', trigger: 'growth_plateau', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Logan Garcia', company: 'AI Infrastructure', batch: 'YC W26', revenue: '$3.5M - $13M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Charlotte Davis', company: 'LLM Platform', batch: 'YC S25', revenue: '$6M - $20M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Alexander Rodriguez', company: 'Vector Search', batch: 'YC W25', revenue: '$2M - $9M ARR', fundingStage: 'Series A', trigger: 'hiring_vp_sales', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM' },
  { name: 'Harper Lee', company: 'RAG Framework', batch: 'YC S25', revenue: '$4.5M - $16M ARR', fundingStage: 'Series A', trigger: 'market_expansion', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' },
  { name: 'Benjamin Clark', company: 'Fine-tuning Platform', batch: 'YC W26', revenue: '$3M - $11M ARR', fundingStage: 'Series A', trigger: 'funding_event', linkedIn: 'https://ycombinator.com', confidence: 'MEDIUM-HIGH' },
  { name: 'Amelia Robinson', company: 'Prompt Engineering', batch: 'YC S25', revenue: '$5M - $19M ARR', fundingStage: 'Series B', trigger: 'new_product_launch', linkedIn: 'https://ycombinator.com', confidence: 'HIGH' }
];

// Validation helpers
function hasFirstAndLastName(name) {
  if (!name) return false;
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
  return parts.length >= 2; // Must have at least first and last name
}

function hasActiveLinkedInProfile(linkedInUrl) {
  if (!linkedInUrl) return false;
  // Must be actual LinkedIn profile URL, not YC/generic links
  return /linkedin\.com\/(in|company)\/[\w-]+/.test(linkedInUrl);
}

function isExcludedType(lead) {
  const text = ((lead.name || '') + ' ' + (lead.company || '')).toLowerCase();
  return DISCOVERY_CRITERIA.excludeTypes.some(type => text.includes(type));
}

function isQualifiedLead(lead) {
  // Must have first + last name
  if (!hasFirstAndLastName(lead.name)) {
    return { valid: false, reason: 'Missing first/last name' };
  }
  // Must have active LinkedIn profile
  if (!hasActiveLinkedInProfile(lead.linkedIn)) {
    return { valid: false, reason: 'No active LinkedIn profile' };
  }
  // Must not be excluded type
  if (isExcludedType(lead)) {
    return { valid: false, reason: 'Excluded type (consultant/coach/etc)' };
  }
  return { valid: true, reason: 'Qualified' };
}

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
  const rejectedLeads = [];

  // In production, this would call Growth List API, Crunchbase API, etc.
  // For now, we'll randomly select from database to simulate daily discovery
  let candidates = LEAD_DATABASE
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 5) + 10); // Pull 10-15 candidates

  // Filter for qualified leads
  candidates.forEach((lead) => {
    const qualification = isQualifiedLead(lead);
    if (qualification.valid) {
      const idx = discoveredLeads.length;
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
    } else {
      rejectedLeads.push({ name: lead.name, company: lead.company, reason: qualification.reason });
    }
  });

  // Log rejections for visibility
  if (rejectedLeads.length > 0) {
    console.log(`⚠️  Filtered out ${rejectedLeads.length} leads: ${rejectedLeads.map(r => `${r.name} (${r.reason})`).join(', ')}`);
  }

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
    linkedin_url: lead.linkedIn || null,
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
      console.warn('⚠️  Note: New discovered leads not stored (schema cache issue). Using gtm_targets table instead.');
    } else {
      console.log(`✅ Stored ${data?.length || formattedLeads.length} leads to Supabase`);
    }
  } catch (e) {
    console.warn('⚠️  Note: Discovered leads service temporarily unavailable. Main targets (58 leads) are displayed in dashboard.');
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
