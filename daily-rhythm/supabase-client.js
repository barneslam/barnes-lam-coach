const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://qiwdgyilhwkndqkgqruf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Supabase tables on first run
async function initializeTables() {
  try {
    console.log('📊 Initializing Supabase tables...');

    // Create outreach_messages table
    const { error: outreachError } = await supabase
      .from('outreach_messages')
      .select('id')
      .limit(1);

    if (outreachError && outreachError.code === 'PGRST116') {
      console.log('Creating outreach_messages table...');
      // Table doesn't exist, will be created via Supabase dashboard SQL editor
      console.log('⚠️  Please run this SQL in Supabase dashboard:\n');
      console.log(`
CREATE TABLE outreach_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  signal TEXT,
  channel TEXT,
  subject TEXT,
  body TEXT,
  full_body TEXT,
  send_date DATE,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `);
    }

    // Create discovered_leads table
    const { error: leadsError } = await supabase
      .from('discovered_leads')
      .select('id')
      .limit(1);

    if (leadsError && leadsError.code === 'PGRST116') {
      console.log('Creating discovered_leads table...');
      console.log('⚠️  Please run this SQL in Supabase dashboard:\n');
      console.log(`
CREATE TABLE discovered_leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  batch TEXT,
  revenue TEXT,
  funding_stage TEXT,
  trigger TEXT,
  linkedin_url TEXT,
  confidence TEXT,
  status TEXT DEFAULT 'discovered',
  requires_connection_first BOOLEAN DEFAULT TRUE,
  next_action TEXT,
  discovered_date DATE,
  discovered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `);
    }

    // Create tracker table
    const { error: trackerError } = await supabase
      .from('tracker')
      .select('id')
      .limit(1);

    if (trackerError && trackerError.code === 'PGRST116') {
      console.log('Creating tracker table...');
      console.log('⚠️  Please run this SQL in Supabase dashboard:\n');
      console.log(`
CREATE TABLE tracker (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  current_week INT,
  start_date DATE,
  day_of_week TEXT,
  blocks_completed TEXT[],
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `);
    }

    // Create outreach_approval table
    const { error: approvalError } = await supabase
      .from('outreach_approval')
      .select('id')
      .limit(1);

    if (approvalError && approvalError.code === 'PGRST116') {
      console.log('Creating outreach_approval table...');
      console.log('⚠️  Please run this SQL in Supabase dashboard:\n');
      console.log(`
CREATE TABLE outreach_approval (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  week INT NOT NULL,
  approval_date DATE,
  approved_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  checklist_items INT DEFAULT 7,
  checklist_completed INT DEFAULT 0,
  message_count INT DEFAULT 7,
  approval_notes TEXT,
  batch_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `);
    }

    console.log('✅ Supabase initialized');
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error.message);
  }
}

// Helper functions for CRUD operations
const db = {
  // Outreach messages
  async getOutreachMessages() {
    const { data, error } = await supabase
      .from('outreach_messages')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async addOutreachMessage(message) {
    const { data, error } = await supabase
      .from('outreach_messages')
      .insert([message])
      .select();
    return { data, error };
  },

  // Discovered leads
  async getDiscoveredLeads(date = null) {
    let query = supabase
      .from('discovered_leads')
      .select('*');

    if (date) {
      query = query.eq('discovered_date', date);
    }

    const { data, error } = await query.order('discovered_at', { ascending: false });
    return { data: data || [], error };
  },

  async addDiscoveredLeads(leads) {
    const { data, error } = await supabase
      .from('discovered_leads')
      .insert(leads)
      .select();
    return { data, error };
  },

  // Tracker
  async getTracker() {
    const { data, error } = await supabase
      .from('tracker')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    return { data: data ? data[0] : null, error };
  },

  async updateTracker(trackerData) {
    const { data, error } = await supabase
      .from('tracker')
      .insert([trackerData])
      .select();
    return { data, error };
  },

  // Outreach Approval
  async getApprovalStatus(week) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .select('*')
      .eq('week', week)
      .order('created_at', { ascending: false })
      .limit(1);
    return { data: data ? data[0] : null, error };
  },

  async logApproval(approvalData) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .insert([approvalData])
      .select();
    return { data, error };
  },

  async updateApprovalStatus(id, updates) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },
};

module.exports = {
  supabase,
  db,
  initializeTables,
};
