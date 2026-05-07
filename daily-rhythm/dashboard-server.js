#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const { runDiscovery } = require('./lead-discovery');
const { db, supabase } = require('./supabase-client');

const PORT = process.env.PORT || 3001;
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

// Content generation functions for regen
function generateLinkedInContent(business) {
  // Extract name/title and company info
  const parts = business.split(' — ');
  const nameTitle = parts[0];
  const companyInfo = parts[1] || '';

  // GTM-focused angles for high-value content
  const angles = [
    `🚀 **The GTM Scaling Playbook:**\n\n${nameTitle} is navigating one of the toughest challenges in SaaS: scaling revenue without losing product-market fit.\n\n${companyInfo} represents a pivotal moment — when product leaders must become go-to-market leaders.\n\nThe window to establish GTM discipline is NOW:\n• Sales velocity often plateaus at $5-10M ARR without systematic GTM\n• Sales cycles lengthen when product messaging doesn't evolve\n• Sales teams often fail because execution rhythm was never established\n• Marketing campaigns miss because buyer journey wasn't mapped\n\nWhat separates $10M from $50M businesses isn't better products. It's better GTM execution.\n\n${nameTitle}'s critical question now: "Do we have a GTM operating rhythm that scales with our ambitions?"\n\nThis is THE moment to get it right. 📊`,

    `📈 **The Revenue Leadership Inflection:**\n\n${nameTitle} is stepping into a role that demands a different skillset than previous positions.\n\nWhat we know:\n• ${companyInfo}\n• Revenue teams often struggle in their first 90 days without a clear GTM strategy\n• The fastest wins come from improving sales productivity, not hiring more reps\n• Market positioning directly impacts win rates, deal sizes, and sales cycle length\n\n**The Reality:** Most leaders inherit messy GTM systems. Inconsistent sales processes. Misaligned messaging across teams. Buyers getting different messages from marketing, sales, and product.\n\nThe opportunity: Clean this up in Q2-Q3, and watch ARR accelerate.\n\n${nameTitle} has the experience. Now comes the execution. 🎯`,

    `🎯 **Revenue Strategy in Motion:**\n\n${nameTitle} is now leading GTM at a critical juncture.\n\nHere's what's usually broken:\n• Sales team doesn't understand product strategy\n• Marketing campaigns don't align with sales priorities\n• Product roadmap doesn't reflect buyer pain points\n• Revenue visibility is reactive, not predictive\n\n${companyInfo} — this is the company that can fix all of that.\n\nThe best GTM leaders don't just manage sales pipelines. They orchestrate alignment between product, marketing, and sales. They establish rhythms. They measure what matters. They iterate based on data.\n\nBut here's the critical insight: GTM alignment can't be delegated. It requires active leadership.\n\n${nameTitle} is the person to make this happen. 💪`,

    `💼 **The GTM Operating System:**\n\n${nameTitle} is stepping into a leadership role where the entire revenue engine is in focus.\n\n${companyInfo} — the opportunity is massive.\n\nMost growth-stage companies struggle because they lack a coherent GTM operating system:\n• Weekly sales reviews without aligned metrics\n• Marketing campaigns that don't move the needle\n• Sales compensation misaligned with company strategy\n• Customer feedback never reaches product\n\nThe fix? A systematic approach to revenue leadership:\n1. Align on ICP and buyer journey\n2. Establish a repeatable sales process\n3. Build marketing programs that feed sales\n4. Create weekly rhythm for visibility and adaptation\n5. Tie comp to outcomes, not activity\n\nThese aren't nice-to-haves. They're survival skills in a scaling company.\n\n${nameTitle} has the mandate. 🚀`
  ];

  // Pick a random angle and ensure it stays under 3000 chars
  let content = angles[Math.floor(Math.random() * angles.length)];
  if (content.length > 3000) {
    content = content.substring(0, 2997) + '...';
  }
  return content;
}

function generateInstagramContent(business) {
  // Extract name/title and company info
  const parts = business.split(' — ');
  const nameTitle = parts[0];
  const companyInfo = parts[1] || '';

  // Instagram-friendly angles
  const angles = [
    `🚀 Revenue leadership moment incoming.\n\n${nameTitle} is now the person responsible for scaling GTM at ${companyInfo}.\n\nHere's what we watch for:\n\n✓ Does the org have a sales process that scales?\n✓ Are marketing and sales aligned on messaging?\n✓ Is there predictable pipeline visibility?\n✓ Can they accelerate expansion revenue?\n\nThe best GTM leaders don't hire their way to growth. They optimize their way there first.\n\nLet's see how this plays out. 📊 #GTMScaling`,

    `📈 Scaling inflection point.\n\n${nameTitle} x ${companyInfo}\n\nWhen leaders like this move into GTM roles, it usually means one thing:\n\nThe company is ready to attack market share.\n\nWhat we're watching:\n• Sales productivity metrics\n• Win rate improvements\n• Sales cycle compression\n• Expansion revenue acceleration\n\nThe next 90 days will tell us everything about their GTM strategy.\n\n#RevenueLeadership #SalesStrategy`,

    `💪 GTM Leadership Spotlight.\n\n${nameTitle}\n${companyInfo}\n\nScaling revenue is 20% product, 80% execution.\n\nMost teams struggle because:\n❌ No clear sales process\n❌ Marketing doesn't support sales\n❌ Leaders make decisions on instinct, not data\n❌ No weekly rhythm for accountability\n\nThe teams that win establish:\n✅ Repeatable sales methodology\n✅ Aligned buyer journey across teams\n✅ Real-time pipeline visibility\n✅ Weekly decision rhythm\n\nLet's see what ${nameTitle} builds. 🎯`,

    `🎯 Revenue Strategy in Motion.\n\n${nameTitle} leading GTM means one thing:\n\nThis company is playing to win.\n\nThe best revenue leaders:\n• Map the entire buyer journey\n• Align product, marketing, and sales\n• Establish accountability through metrics\n• Iterate based on what's actually working\n\nNot what they think is working.\nWhat's actually working.\n\nThat's the difference between $10M and $50M. 📊 #GTMStrategy`
  ];

  let content = angles[Math.floor(Math.random() * angles.length)];
  if (content.length > 2200) {
    content = content.substring(0, 2197) + '...';
  }
  return content;
}

function generateWeeklyPosts(draft, numWeeks = 4) {
  // Generate LinkedIn and Instagram posts for 5 days a week (Mon-Fri) for numWeeks
  const posts = [];
  const startDate = new Date('2026-04-21'); // Next Monday (April 21, 2026)
  let postDate = new Date(startDate);

  const liContent = generateLinkedInContent(draft.business);
  const igContent = generateInstagramContent(draft.business);

  for (let week = 0; week < numWeeks; week++) {
    for (let day = 0; day < 5; day++) { // Mon-Fri
      // LinkedIn post at 9am EST (13:00 UTC)
      const liDate = new Date(postDate);
      liDate.setHours(13, 0, 0, 0);
      posts.push({
        business: draft.business,
        channel: 'linkedin',
        accountId: '17347',
        content: liContent,
        scheduledTime: liDate.toISOString()
      });

      // Instagram post at 9am EST (13:00 UTC)
      const igDate = new Date(postDate);
      igDate.setHours(13, 0, 0, 0);
      posts.push({
        business: draft.business,
        channel: 'instagram',
        accountId: '40098',
        content: igContent,
        scheduledTime: igDate.toISOString()
      });

      postDate.setDate(postDate.getDate() + 1);
    }
    // Skip weekend (Sat/Sun)
    postDate.setDate(postDate.getDate() + 2);
  }

  return posts;
}

async function publishPostsToBlotato(posts) {
  const https = require('https');
  let published = 0;
  const failed = [];

  for (const post of posts) {
    try {
      const payload = {
        post: {
          accountId: post.accountId,
          content: {
            text: post.content,
            mediaUrls: [],
            platform: post.channel
          },
          target: { targetType: post.channel }
        },
        scheduledTime: post.scheduledTime
      };

      const result = await new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(payload);
        const options = {
          hostname: 'backend.blotato.com',
          path: '/v2/posts',
          method: 'POST',
          headers: {
            'blotato-api-key': process.env.BLOTATO_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              resolve({ statusCode: res.statusCode, data: data });
            }
          });
        });

        req.on('error', reject);
        req.write(bodyStr);
        req.end();
      });

      if (result.statusCode === 201) {
        published++;
      } else {
        failed.push({ post, statusCode: result.statusCode });
      }
    } catch (e) {
      failed.push({ post, error: e.message });
    }
  }

  return {
    published,
    failed: failed.length,
    total: posts.length,
    failedDetails: failed.length > 0 ? failed.slice(0, 5) : []
  };
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

  '/api/connection-message': async (body) => {
    const { targetId, customPrompt } = body;
    if (!targetId) return { error: 'targetId required' };

    try {
      const { data: target, error } = await supabase
        .from('gtm_targets')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error || !target) return { error: 'Target not found' };

      const firstName = target.name.split(' ')[0];
      let message;
      if (customPrompt) {
        // Generate customized message based on prompt
        const variations = {
          'shorter': `Hi ${firstName}, impressed by your work at ${target.business.split(' — ')[0]}. Let's connect on GTM scaling.`,
          'longer': `Hi ${firstName},\n\nI've been following your work at ${target.business.split(' — ')[0]} and I'm genuinely impressed by your approach to ${(target.signal || '').split('.')[0].toLowerCase()}.\n\nI specialize in GTM strategy and revenue scaling for B2B companies. I think there could be a compelling conversation around how your team can accelerate growth through better market positioning and sales execution.\n\nWould love to connect and explore this further.\n\nBest regards`,
          'technical': `Hi ${firstName}, your GTM execution at ${target.business.split(' — ')[0]} caught my attention. Let's discuss scaling revenue through systematic processes and data-driven strategies.`,
          'casual': `Hey ${firstName}, your work at ${target.business.split(' — ')[0]} is impressive. Would love to connect and chat about GTM scaling trends.`,
          'urgency': `Hi ${firstName}, your team at ${target.business.split(' — ')[0]} is at an inflection point. I help companies like yours accelerate GTM. Let's connect.`
        };

        // Try to match prompt intent
        let baseVariation = 'longer';
        const promptLower = customPrompt.toLowerCase();
        if (promptLower.includes('short')) baseVariation = 'shorter';
        if (promptLower.includes('casual') || promptLower.includes('friendly')) baseVariation = 'casual';
        if (promptLower.includes('urgency') || promptLower.includes('urgent')) baseVariation = 'urgency';
        if (promptLower.includes('technical') || promptLower.includes('execution')) baseVariation = 'technical';

        message = variations[baseVariation] || variations['longer'];
      } else {
        // Default message
        message = `Hi ${firstName}, I've been impressed by your work at ${target.business.split(' — ')[0]}—particularly your focus on ${(target.signal || '').split('.')[0].toLowerCase()}. I'd love to connect and share insights on GTM scaling. Looking forward to it!`;
      }

      return {
        success: true,
        target_name: target.name,
        company: target.business,
        signal: target.signal,
        connection_message: message
      };
    } catch (e) {
      console.error('Connection message error:', e.message);
      return { error: e.message };
    }
  },

  '/api/targets': async () => {
    try {
      const { data: targets, error } = await supabase
        .from('gtm_targets')
        .select('*,draft_message')
        .order('date_found', { ascending: false });

      if (error) {
        console.error('Error fetching targets:', error);
        return { targets: [] };
      }

      // Get all draft templates for matching
      const draftsRes = routes['/api/drafts']();
      const allDrafts = draftsRes.published || [];
      const draftMap = {};
      allDrafts.forEach(d => {
        if (!draftMap[d.business]) {
          draftMap[d.business] = d;
        }
      });

      // Transform database fields and attach draft content
      const formattedTargets = (targets || []).map(target => {
        const draft = draftMap[target.business];
        return {
          id: target.id,
          name: target.name,
          business: target.business,
          signal: target.signal,
          channel: target.outreach_channel,
          status: target.status || 'identified',
          confidence: target.confidence || 'MEDIUM',
          linkedin_url: target.linkedin_url,
          qualified: target.qualified,
          draft_message: target.draft_message,
          draft_content: draft ? {
            linkedin_draft: draft.linkedin_draft,
            instagram_draft: draft.instagram_draft,
            scheduled_for: draft.scheduled_for,
            draft_id: draft.id
          } : null
        };
      });

      return { targets: formattedTargets };
    } catch (e) {
      console.error('Targets API error:', e.message);
      return { targets: [] };
    }
  },

  '/api/drafts': async () => {
    try {
      const { data: drafts, error } = await supabase
        .from('content_drafts')
        .select('id,business,linkedin_draft,instagram_draft,status,created_at,scheduled_for')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !drafts) {
        return { pending: [], approved: [], published: [] };
      }

      const pending = drafts.filter(d => d.status === 'pending').map(d => ({
        id: d.id,
        business: d.business || 'Unknown',
        linkedin_draft: (d.linkedin_draft || '').substring(0, 200),
        instagram_draft: (d.instagram_draft || '').substring(0, 200),
        status: 'pending',
        created_at: d.created_at
      }));

      const approved = drafts.filter(d => d.status === 'approved').map(d => ({
        id: d.id,
        business: d.business || 'Unknown',
        linkedin_draft: (d.linkedin_draft || '').substring(0, 200),
        instagram_draft: (d.instagram_draft || '').substring(0, 200),
        status: 'approved',
        scheduled_for: d.scheduled_for
      }));

      const published = drafts.filter(d => d.status === 'published').map(d => ({
        id: d.id,
        business: d.business || 'Unknown',
        status: 'published',
        scheduled_for: d.scheduled_for
      }));

      return {
        pending: pending,
        approved: approved,
        published: published
      };
    } catch (e) {
      console.error('Drafts API error:', e.message);
      return { pending: [], approved: [], published: [] };
    }
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

  '/api/dm-outreach': async () => {
    try {
      const { data, error } = await supabase
        .from('dm_outreach')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching dm_outreach:', error);
        return { dmOutreach: [], error: error.message };
      }
      return { dmOutreach: data || [] };
    } catch (e) {
      console.error('DM Outreach API error:', e.message);
      return { dmOutreach: [], error: e.message };
    }
  },

  '/api/send-dm-response': async (body) => {
    try {
      const { handler } = require('./functions/send-dm-response');
      const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify(body)
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Send DM response error:', e.message);
      return { error: e.message };
    }
  },

  '/api/content': async () => {
    try {
      const { data: drafts, error } = await supabase
        .from('gtm_drafts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !drafts || drafts.length === 0) {
        return {
          content: [
            {
              id: 1,
              business: 'TechCorp Series B',
              trigger: 'funding_event',
              signal: 'Series B Funding',
              linkedin_draft: '🚀 TechCorp Series B = GTM refresh incoming 🔥',
              instagram_draft: '🚀 TechCorp Series B = GTM refresh 🔥',
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ],
          status_counts: { pending: 1, approved: 0, published: 0 },
          total_count: 1
        };
      }

      const statusCounts = {
        pending: drafts.filter(d => d.status === 'pending').length,
        approved: drafts.filter(d => d.status === 'approved').length,
        published: drafts.filter(d => d.status === 'published').length
      };

      return {
        content: drafts,
        status_counts: statusCounts,
        total_count: drafts.length
      };
    } catch (e) {
      console.error('Content API error:', e.message);
      return {
        content: [],
        status_counts: { pending: 0, approved: 0, published: 0 },
        total_count: 0,
        error: e.message
      };
    }
  },

  '/api/inbound': async () => {
    try {
      const { data: messages, error } = await supabase
        .from('inbound_messages')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);

      if (error || !messages || messages.length === 0) {
        return {
          messages: [
            {
              id: 1,
              channel: 'email',
              sender_name: 'Jennifer Martinez',
              sender_email: 'jen@acmecorp.com',
              sender_title: 'CRO',
              sender_company: 'ACME Corp',
              message_text: 'Hi, we\'re looking to improve our go-to-market strategy...',
              auto_qualified: true,
              qualification_score: 88,
              lead_status: 'new',
              received_at: new Date().toISOString()
            }
          ],
          qualification_metrics: { total: 1, qualified: 1, percentQualified: 100, avgScore: 88 },
          status_metrics: { new: 1, contacted: 0, responded: 0, qualified: 0, booked: 0 },
          channel_metrics: { email: 1 }
        };
      }

      const qualified = messages.filter(m => m.auto_qualified).length;
      const statusMetrics = {
        new: messages.filter(m => m.lead_status === 'new').length,
        contacted: messages.filter(m => m.lead_status === 'contacted').length,
        responded: messages.filter(m => m.lead_status === 'responded').length,
        qualified: messages.filter(m => m.lead_status === 'qualified').length,
        booked: messages.filter(m => m.lead_status === 'booked').length
      };

      const channelMetrics = {};
      messages.forEach(m => {
        channelMetrics[m.channel] = (channelMetrics[m.channel] || 0) + 1;
      });

      return {
        messages,
        qualification_metrics: {
          total: messages.length,
          qualified,
          notQualified: messages.length - qualified,
          percentQualified: (qualified / messages.length) * 100,
          avgScore: messages.reduce((sum, m) => sum + (m.qualification_score || 0), 0) / messages.length
        },
        status_metrics: statusMetrics,
        channel_metrics: channelMetrics
      };
    } catch (e) {
      console.error('Inbound API error:', e.message);
      return {
        messages: [],
        qualification_metrics: { total: 0, qualified: 0, percentQualified: 0, avgScore: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0 },
        channel_metrics: {},
        error: e.message
      };
    }
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

  '/api/dms': async () => {
    try {
      const { handler } = require('./functions/dms');
      const mockEvent = {
        httpMethod: 'GET',
        queryStringParameters: { limit: '50', days: '7', status: 'all' }
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('DMs API error:', e.message);
      return { error: e.message };
    }
  },

  '/api/linkedin-webhook-handler': async (body) => {
    // This will be called via POST handler below
    try {
      const { handler } = require('./functions/linkedin-webhook');
      const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify(body),
        headers: { 'x-blotato-signature': 'test-signature' }
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('LinkedIn webhook error:', e.message);
      return { error: e.message };
    }
  },

  '/api/test-dm-pipeline': async () => {
    try {
      const { handler } = require('./functions/test-dm-pipeline');
      const mockEvent = {
        httpMethod: 'POST',
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Test DM pipeline error:', e.message);
      return { error: e.message };
    }
  },

  '/api/blotato-dm-poller': async () => {
    try {
      const { handler } = require('./functions/blotato-dm-poller');
      const mockEvent = {
        httpMethod: 'POST',
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Blotato DM poller error:', e.message);
      return { error: e.message };
    }
  },

  '/api/dm-handler': async (body) => {
    try {
      const { handleDMAndCreateLead } = require('./curation-skill');
      const dmData = {
        sender_name: body.sender_name || 'Unknown',
        sender_email: body.sender_email || '',
        message_text: body.message_text || body.text || '',
        source_content_id: body.source_content_id || body.piece_title || 'unknown'
      };

      const lead = await handleDMAndCreateLead(dmData);

      if (lead) {
        console.log(`✅ DM handler: Created lead for ${dmData.sender_name}`);
        return { success: true, lead_id: lead.id, message: `Lead created for ${dmData.sender_name}` };
      } else {
        return { error: 'Failed to create lead from DM' };
      }
    } catch (e) {
      console.error('DM handler error:', e.message);
      return { error: e.message };
    }
  },

  '/api/lead/update-status': async (body) => {
    try {
      const { leadId, status } = body;
      const { error } = await supabase
        .from('gtm_targets')
        .update({ status })
        .eq('id', leadId);

      if (error) {
        return { error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error('Lead status update error:', e.message);
      return { error: e.message };
    }
  },

  '/api/test-full-pipeline': async () => {
    try {
      console.log('🧪 Running full pipeline test...');

      // Step 1: Get top 20 leads
      const { data: topLeads } = await supabase
        .from('gtm_targets')
        .select('id, name, business, signal')
        .eq('status', 'connection_req')
        .limit(20);

      if (!topLeads || topLeads.length === 0) {
        return { error: 'No leads found for content generation' };
      }

      let createdCount = 0;
      const draftIds = [];

      // Step 2: Generate content
      for (const lead of topLeads) {
        const linkedinDraft = `🚀 ${lead.name} at ${lead.business.split(',')[0]} - ${lead.signal}. Expert on GTM scaling & revenue acceleration. Open to strategic conversations.`;
        const instagramDraft = `Meet ${lead.name}: ${lead.signal}. Leading GTM at scale. 📈`;

        const { data: draft } = await supabase
          .from('gtm_drafts')
          .insert({
            business: lead.business,
            trigger: lead.signal,
            signal: lead.signal,
            linkedin_draft: linkedinDraft,
            instagram_draft: instagramDraft,
            status: 'pending',
            created_at: new Date().toISOString(),
            scheduled_for: new Date(Date.now() + 24 * 3600000).toISOString()
          })
          .select('id')
          .single();

        if (draft) {
          createdCount++;
          draftIds.push(draft.id);
        }
      }

      // Step 3: Auto-approve all drafts
      let approvedCount = 0;
      for (const draftId of draftIds) {
        const { error } = await supabase
          .from('gtm_drafts')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', draftId);
        if (!error) approvedCount++;
      }

      // Step 4: Mark as published (mock Blotato)
      let publishedCount = 0;
      for (const draftId of draftIds) {
        const { error } = await supabase
          .from('gtm_drafts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            published_to: 'linkedin,instagram',
            blotato_post_id: `test_${Date.now()}`
          })
          .eq('id', draftId);
        if (!error) publishedCount++;
      }

      return {
        status: 'success',
        message: 'Full pipeline test completed',
        generated: createdCount,
        approved: approvedCount,
        published: publishedCount,
        leadsSampled: topLeads.length,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Pipeline test error:', e.message);
      return { error: e.message };
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

  // Handle /api/linkedin-webhook (POST)
  if (req.url === '/api/linkedin-webhook' && req.method === 'POST') {
    try {
      const result = await routes['/api/linkedin-webhook-handler'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('LinkedIn webhook error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/send-dm-response (POST)
  if (req.url === '/api/send-dm-response' && req.method === 'POST') {
    try {
      const result = await routes['/api/send-dm-response'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('Send DM response error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/dm-handler (POST) - Blotato webhook
  if (req.url === '/api/dm-handler' && req.method === 'POST') {
    try {
      const result = await routes['/api/dm-handler'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('DM handler error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
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

  // Handle /api/lead/update-status (POST)
  if (req.url === '/api/lead/update-status' && req.method === 'POST') {
    try {
      const result = await routes['/api/lead/update-status'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('Lead status update error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/drafts/:id/delete (POST) - RIN carousel system
  if (req.url.match(/^\/api\/drafts\/[^/]+\/delete$/) && req.method === 'POST') {
    const draftId = req.url.split('/')[3];
    console.log('📌 DELETE draft:', draftId);
    try {
      const { error } = await supabase
        .from('gtm_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Draft deleted' }));
    } catch (e) {
      console.error('Delete draft error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/drafts/:id/reject (POST) - RIN carousel system
  if (req.url.match(/^\/api\/drafts\/[^/]+\/reject$/) && req.method === 'POST') {
    const draftId = req.url.split('/')[3];
    console.log('🚫 REJECT draft:', draftId);
    try {
      const { error } = await supabase
        .from('gtm_drafts')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', draftId);

      if (error) throw error;

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Draft rejected' }));
    } catch (e) {
      console.error('Reject draft error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/drafts/:id/regen (POST)
  if (req.url.match(/^\/api\/drafts\/[^/]+\/regen$/) && req.method === 'POST') {
    const draftId = req.url.split('/')[3];
    try {
      // Find the draft in templates
      const draftRouteHandler = routes['/api/drafts'];
      const draftsData = draftRouteHandler();
      const allDrafts = draftsData.published || [];
      const draft = allDrafts.find(d => d.id === draftId);

      if (!draft) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Draft not found' }));
        return;
      }

      // Generate new high-value content
      const newLinkedIn = generateLinkedInContent(draft.business);
      const newInstagram = generateInstagramContent(draft.business);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Draft regenerated',
        linkedin_draft: newLinkedIn,
        instagram_draft: newInstagram,
        linkedin_chars: newLinkedIn.length,
        instagram_chars: newInstagram.length
      }));
    } catch (e) {
      console.error('Draft regen error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/publish-posts-to-blotato (POST) - Save drafts for approval
  if (req.url === '/api/publish-posts-to-blotato' && req.method === 'POST') {
    const { draftId, numWeeks = 4 } = body;
    try {
      const draftRouteHandler = routes['/api/drafts'];
      const draftsData = draftRouteHandler();
      const allDrafts = [...(draftsData.pending || []), ...(draftsData.published || [])];
      const draft = allDrafts.find(d => d.id === draftId);

      if (!draft) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Draft target not found' }));
        return;
      }

      // Generate posts for 5 days a week for numWeeks
      const posts = generateWeeklyPosts(draft, numWeeks);

      // Save posts to database with status='pending' for approval
      const savedDrafts = [];
      for (const post of posts) {
        const { data, error } = await supabase
          .from('content_drafts')
          .insert({
            business: draft.business,
            linkedin_draft: post.linkedin,
            instagram_draft: post.instagram,
            scheduled_for: post.scheduled_for,
            status: 'pending'
          })
          .select();

        if (error) console.error('Save error:', error);
        else if (data && data[0]) savedDrafts.push(data[0]);
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: `Generated ${savedDrafts.length} posts saved for your approval`,
        posts_count: savedDrafts.length
      }));
    } catch (e) {
      console.error('Generate drafts error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/approve-draft (POST) - Approve pending draft
  if (req.url === '/api/approve-draft' && req.method === 'POST') {
    const { draftId } = body;
    try {
      const { error } = await supabase
        .from('content_drafts')
        .update({ status: 'approved' })
        .eq('id', draftId);

      if (error) throw error;

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Draft approved' }));
    } catch (e) {
      console.error('Approval error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/publish-approved-drafts (POST) - Publish all approved drafts
  if (req.url === '/api/publish-approved-drafts' && req.method === 'POST') {
    try {
      const { data: approved, error } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'approved');

      if (error) throw error;

      if (!approved || approved.length === 0) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'No approved drafts to publish', posts_count: 0 }));
        return;
      }

      // Convert database records to post format
      const posts = approved.map(draft => ({
        linkedin: draft.linkedin_draft,
        instagram: draft.instagram_draft,
        scheduled_for: draft.scheduled_for
      }));

      // Send to Blotato API
      const results = await publishPostsToBlotato(posts);

      // Mark as published in database
      for (const draft of approved) {
        await supabase
          .from('content_drafts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', draft.id);
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: `Published ${results.published} posts to Blotato`,
        details: results,
        posts_count: posts.length
      }));
    } catch (e) {
      console.error('Publish approved error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/content/:id/approve (POST) - Approve content draft
  if (req.url.match(/^\/api\/content\/\d+\/approve$/) && req.method === 'POST') {
    const contentId = parseInt(req.url.split('/')[3]);
    try {
      const { error } = await supabase
        .from('gtm_drafts')
        .update({ status: 'approved' })
        .eq('id', contentId);

      if (error) throw error;

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Content approved' }));
    } catch (e) {
      console.error('Approve content error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/content/:id/reject (POST) - Reject content draft
  if (req.url.match(/^\/api\/content\/\d+\/reject$/) && req.method === 'POST') {
    const contentId = parseInt(req.url.split('/')[3]);
    try {
      const { error } = await supabase
        .from('gtm_drafts')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Content rejected and deleted' }));
    } catch (e) {
      console.error('Reject content error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle other API routes
  const basePath = req.url.split('?')[0];
  if (routes[basePath]) {
    try {
      const data = await routes[basePath](body);
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
}

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
