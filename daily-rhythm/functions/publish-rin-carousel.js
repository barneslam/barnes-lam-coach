const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

function callBlotato(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
    };

    const options = {
      hostname: 'backend.blotato.com',
      path: path,
      method: method,
      headers
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
}

function extractImageFromCarouselFile(date) {
  const draftDir = path.join(process.cwd(), 'drafts', 'rin');
  if (!fs.existsSync(draftDir)) return null;

  const files = fs.readdirSync(draftDir).filter(f => f.includes(date) && f.endsWith('.md'));
  if (files.length === 0) return null;

  const filePath = path.join(draftDir, files[0]);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract image URL from frontmatter
  const match = content.match(/image:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function sanitizeCarouselContent(content) {
  // Fix text overflow issues in carousel posts by:
  // 1. Breaking long headline sentences at logical points
  // 2. Limiting to ~55 chars per line for carousel display

  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Skip if line is too short
    if (line.length < 55) return line;

    // For long lines, try to break at word boundaries
    if (line.length > 55) {
      const words = line.split(' ');
      const result = [];
      let current = '';

      for (const word of words) {
        if ((current + (current ? ' ' : '') + word).length <= 55) {
          current += (current ? ' ' : '') + word;
        } else {
          if (current) result.push(current);
          current = word;
        }
      }
      if (current) result.push(current);

      return result.join('\n');
    }

    return line;
  });

  return processedLines.join('\n');
}

exports.handler = async (event, context) => {
  try {
    console.log('🚀 RIN Carousel Publishing Started');

    const supabaseUrl = process.env.SUPABASE_URL_RIN;
    const supabaseKey = process.env.SUPABASE_ANON_KEY_RIN;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing RIN Supabase credentials');
    }

    if (!process.env.BLOTATO_API_KEY) {
      throw new Error('Missing BLOTATO_API_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date or use provided date
    const queryDate = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];

    console.log(`📅 Looking for approved drafts on: ${queryDate}`);

    // Query gtm_drafts for today's date
    const { data: drafts, error } = await supabase
      .from('gtm_drafts')
      .select('*')
      .eq('draft_date', queryDate);

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    if (!drafts || drafts.length === 0) {
      console.log('❌ No approved drafts found for this date');
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'no_content',
          message: 'No approved drafts found',
          date: queryDate,
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log(`Found ${drafts.length} draft(s)\n`);

    let published = 0;
    const failed = [];
    const results = [];

    // RIN Blotato configuration
    const rinConfig = {
      accounts: {
        facebook: {
          account_id: '30406',
          page_id: '1055037511034719'
        },
        instagram: {
          account_id: '45382'
        }
      }
    };

    for (const draft of drafts) {
      if (draft.status !== 'approved') {
        console.log(`⏭️  Skipping "${draft.title}" (status: ${draft.status})`);
        continue;
      }

      const channels = draft.channel.split(',').map(c => c.trim());
      const content = sanitizeCarouselContent(draft.content);
      const mediaUrls = draft.graphic_url ? [draft.graphic_url] : []; // Unique graphic per post if available

      console.log(`📝 Publishing: "${draft.title}"`);
      if (draft.graphic_url) {
        console.log(`   📸 Graphic: ${draft.graphic_url.substring(0, 50)}...`);
      }


      // Publish to each channel
      for (const channel of channels) {
        const accountConfig = rinConfig.accounts[channel];
        if (!accountConfig) {
          console.log(`   ⚠️  ${channel} not configured`);
          failed.push(`${draft.title}/${channel}`);
          continue;
        }

        const target = { targetType: channel };
        if (channel === 'instagram') {
          target.pageId = accountConfig.account_id;
        } else if (channel === 'facebook') {
          target.pageId = accountConfig.page_id || accountConfig.account_id;
        }

        const payload = {
          post: {
            accountId: accountConfig.account_id,
            content: {
              text: content,
              mediaUrls: mediaUrls,
              platform: channel
            },
            target
          }
        };

        try {
          console.log(`   📡 Sending to ${channel}...`);
          const result = await callBlotato('POST', '/v2/posts', payload);
          console.log(`      Response: ${result.statusCode}`);

          if (result.statusCode === 200 || result.statusCode === 201) {
            console.log(`   ✅ ${channel}: posted`);
            published++;
            results.push({
              title: draft.title,
              channel,
              status: 'published'
            });
          } else {
            console.log(`   ❌ ${channel}: ${result.statusCode}`);
            failed.push(`${draft.title}/${channel}`);
            results.push({
              title: draft.title,
              channel,
              status: 'failed',
              statusCode: result.statusCode
            });
          }
        } catch (err) {
          console.log(`   ❌ ${channel}: ${err.message}`);
          failed.push(`${draft.title}/${channel}`);
          results.push({
            title: draft.title,
            channel,
            status: 'error',
            error: err.message
          });
        }
      }
    }

    console.log(`\n✅ Publishing complete: ${published} published`);
    if (failed.length > 0) {
      console.log(`⚠️  Failed: ${failed.join(', ')}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        published,
        failed: failed.length,
        total: channels.length * drafts.length,
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Publishing failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
