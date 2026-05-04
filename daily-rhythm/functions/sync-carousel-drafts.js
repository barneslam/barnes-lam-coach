const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const [, frontmatter, body] = match;
  const meta = {};

  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      meta[key] = value;
    }
  });

  return { meta, body: body.trim() };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };

  try {
    // Read carousel drafts from the drafts directory
    const draftsDir = path.join(__dirname, '..', 'drafts');
    let files = [];

    try {
      files = fs.readdirSync(draftsDir)
        .filter(f => f.match(/^carousel-2026-05-\d{2}\.md$/))
        .sort();
    } catch (err) {
      console.warn('Could not read drafts directory from filesystem:', err.message);
      // In production, files may not be directly accessible
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: 'Drafts directory not accessible. Use Supabase API directly.'
        })
      };
    }

    if (files.length === 0) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ message: 'No carousel drafts found', synced: 0 })
      };
    }

    const draftsToSync = [];

    for (const filename of files) {
      try {
        const filePath = path.join(draftsDir, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        const draftDate = meta.date || filename.match(/carousel-(.+?)\.md/)[1];

        draftsToSync.push({
          draft_date: draftDate,
          status: meta.status || 'pending',
          content: body,
          channel: meta.channel || 'instagram,facebook,linkedin',
          type: meta.type || 'carousel',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Error parsing ${filename}:`, err.message);
      }
    }

    if (draftsToSync.length === 0) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ message: 'No valid drafts to sync', synced: 0 })
      };
    }

    // Check if drafts already exist and upsert
    const results = [];

    for (const draft of draftsToSync) {
      try {
        // Check if draft already exists
        const { data: existing } = await supabase
          .from('gtm_drafts')
          .select('id')
          .eq('draft_date', draft.draft_date)
          .single();

        let result;

        if (existing) {
          // Update existing
          const { data, error } = await supabase
            .from('gtm_drafts')
            .update({
              content: draft.content,
              status: draft.status,
              channel: draft.channel,
              type: draft.type,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select();

          if (error) throw error;
          result = { action: 'updated', draft_date: draft.draft_date };
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('gtm_drafts')
            .insert([draft])
            .select();

          if (error) throw error;
          result = { action: 'created', draft_date: draft.draft_date };
        }

        results.push(result);
      } catch (err) {
        results.push({
          action: 'failed',
          draft_date: draft.draft_date,
          error: err.message
        });
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        message: 'Sync complete',
        synced: results.filter(r => r.action !== 'failed').length,
        failed: results.filter(r => r.action === 'failed').length,
        results
      })
    };
  } catch (err) {
    console.error('Sync error:', err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
