// Inline tracker data for serverless deployment
const trackerData = {
  "current_week": 1,
  "start_date": "2026-04-14",
  "pipeline_status": {"identified": 20, "messaged": 0, "responded": 0, "call_booked": 0, "call_completed": 0, "proposal_sent": 0, "estimated_value": "$0 (pending first responses)"},
  "days": {
    "2026-04-13": {
      "day_of_week": "Sunday",
      "blocks_completed": ["trigger-scan", "build-deliver", "daily-log"],
      "trigger_scan": {"companies_scanned": 12, "qualified": 4, "borderline": 2, "key_findings": "Series A/B companies in $2M-$50M range most accessible. Recommend Growth List + Crunchbase for full 8-lead target."},
      "build_deliver": {"status": "week_1_infrastructure_prep", "assets_generated": ["offer-doc.md (verified)", "tracking-template.csv (expanded to 10 targets)", "conor-brief.md (generated)", "outreach-messages-week1.md (7 drafted messages)"], "ready_for_week_1": true, "messages_ready_to_send": 7, "next_actions": "Send all outreach messages Tuesday 2026-04-15"},
      "lead_discovery": {"status": "completed", "leads_discovered": 5, "timestamp": "2026-04-13T19:11:31.098Z", "next_step": "send_connection_requests"}
    },
    "2026-04-14": {"day_of_week": "Monday", "blocks_scheduled": ["opening", "closing (1:00-3:00 PM)"], "closing_focus": "Pre-outreach checklist + response monitoring setup", "expected_outcomes": ["Verify 7 outreach messages ready", "Set up response monitoring", "Prepare pre-call brief template"]},
    "2026-04-15": {"day_of_week": "Tuesday", "blocks_scheduled": ["outreach", "closing (1:00-3:00 PM)"], "closing_focus": "Execute outreach + monitor for immediate responses", "expected_outcomes": ["Send all 7 outreach messages", "Update tracking-template.csv", "Monitor delivery health"]},
    "2026-04-17": {"day_of_week": "Wednesday", "blocks_scheduled": ["closing (1:00-3:00 PM)"], "closing_focus": "Response handling + pre-call prep", "expected_outcomes": ["Handle responses (if any arrive)", "Draft pre-call research briefs", "Schedule calls"]},
    "2026-04-18": {"day_of_week": "Thursday", "blocks_scheduled": ["closing (1:00-3:00 PM)"], "closing_focus": "Convert responses → calls + follow-up planning", "expected_outcomes": ["Confirm call bookings", "Prepare 1-page briefs", "Plan Friday follow-ups if needed"]},
    "2026-04-19": {"day_of_week": "Friday", "blocks_scheduled": ["content-batch"], "content_batch_focus": "Next week's content generation + proposal drafting", "expected_outcomes": ["5-7 posts scheduled across Blotato channels", "Proposals drafted (if calls booked)", "Week 1 analytics logged"]}
  }
};

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(trackerData),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };
};
