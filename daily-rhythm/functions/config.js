// Inline config data for serverless deployment
const configData = {
  "version": "1.0",
  "timezone": "America/Toronto",
  "blocks": [
    {
      "id": "trigger-scan",
      "name": "Trigger Scan",
      "time": "07:00",
      "duration_min": 60,
      "description": "LinkedIn + job boards. Identify 3-5 companies showing hiring/launch/plateau signals.",
      "prompts": ["Which companies did you identify today?", "What trigger signals did you spot (hiring, launch, plateau)?", "How many companies added to target list?"],
      "metric": "companies_scanned"
    },
    {"id": "outreach", "name": "Outreach", "time": "08:00", "duration_min": 90, "description": "Send 5-8 personalized trigger messages. No templates -- use angles from your plan.", "prompts": ["How many messages sent this block?", "Which trigger angle did you use most?", "Any immediate responses?"], "metric": "messages_sent"},
    {"id": "build-deliver", "name": "Build / Deliver", "time": "09:30", "duration_min": 150, "description": "Infrastructure in weeks 1-3, client work from week 4+.", "prompts": ["What did you build or deliver this block?", "Any client sessions completed?"], "metric": "sessions_delivered"},
    {"id": "follow-up", "name": "Follow-up", "time": "12:00", "duration_min": 60, "description": "Reply to responses, schedule calls, track in CRM spreadsheet.", "prompts": ["How many responses received today so far?", "Any calls booked?", "Updated tracking spreadsheet?"], "metric": "responses_received"},
    {"id": "closing", "name": "Closing / Pipeline", "time": "13:00", "duration_min": 120, "description": "Mon-Thu: Work active leads — prep for calls, write proposals, close deals. Fri: Weekly content batch for next week.", "prompts": [], "metric": "pipeline_activity"},
    {"id": "daily-log", "name": "Daily Log", "time": "15:00", "duration_min": 30, "description": "5-minute non-negotiable. Messages sent, responses, calls booked, revenue closed.", "prompts": ["Total messages sent today?", "Total responses received?", "Calls booked?", "Revenue closed ($)?", "One thing that worked well?", "One thing to change tomorrow?"], "metric": "daily_summary"}
  ],
  "weekly_targets": {"leads_generated": 40, "messages_sent": 40, "responses": "8-12", "calls_booked": 4, "sessions_delivered": 0, "revenue": 0},
  "week": 1
};

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(configData),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };
};
