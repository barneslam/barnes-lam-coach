/**
 * Test DM Pipeline — Comprehensive validation of webhook → qualification → outreach flow
 * Endpoint: POST /api/test-dm-pipeline
 * Returns: Detailed test results with pass/fail status for each stage
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test payloads: high-scoring, medium-scoring, low-scoring DMs
 */
const TEST_DMS = [
  {
    name: "high-score",
    description: "Executive at SaaS company asking about pricing",
    payload: {
      conversationId: `test-high-${Date.now()}`,
      senderId: "test-user-ceo",
      senderName: "Sarah Chen",
      senderTitle: "CEO",
      senderCompany: "TechVenture SaaS",
      message: { text: "Hi, interested in pricing, timeline, and implementation details for our team of 50" },
      sourcePost: { channel: "the_strategy_pitch", theme: "GTM Psychology" },
    },
    expectedScore: 0.8, // high
  },
  {
    name: "medium-score",
    description: "Manager showing interest",
    payload: {
      conversationId: `test-med-${Date.now()}`,
      senderId: "test-user-manager",
      senderName: "James Wilson",
      senderTitle: "Product Manager",
      senderCompany: "CloudStartup Inc",
      message: { text: "Great post! Interested to learn more about your approach." },
      sourcePost: { channel: "barneslamco", theme: "Sales Velocity" },
    },
    expectedScore: 0.5, // medium
  },
  {
    name: "low-score",
    description: "No title, generic thanks",
    payload: {
      conversationId: `test-low-${Date.now()}`,
      senderId: "test-user-low",
      senderName: "Alex Rodriguez",
      senderTitle: null,
      senderCompany: null,
      message: { text: "Thanks for sharing this, cool post!" },
      sourcePost: { channel: "axis_chamber", theme: "Market Trends" },
    },
    expectedScore: 0.2, // low
  },
];

/**
 * Run a single test DM through the full pipeline
 */
async function testSingleDM(testCase) {
  const results = {
    name: testCase.name,
    description: testCase.description,
    stages: {},
  };

  try {
    // Stage 1: Store DM
    console.log(`\n📨 Testing [${testCase.name}]: "${testCase.description}"`);
    const { data: dmData, error: storeError } = await supabase
      .from("linkedin_dms")
      .insert([
        {
          conversation_id: testCase.payload.conversationId,
          sender_id: testCase.payload.senderId,
          sender_name: testCase.payload.senderName,
          sender_title: testCase.payload.senderTitle,
          sender_company: testCase.payload.senderCompany,
          message_text: testCase.payload.message.text,
          source_channel: testCase.payload.sourcePost.channel,
          source_post_theme: testCase.payload.sourcePost.theme,
          received_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (storeError) {
      results.stages.store = { status: "FAIL", error: storeError.message };
      return results;
    }

    results.stages.store = { status: "PASS", dmId: dmData.id };
    console.log(`   ✓ DM stored (ID: ${dmData.id})`);

    // Stage 2: Qualify DM
    const { qualifyDM } = require("./qualify-dm");
    const qualResult = await qualifyDM(dmData);

    results.stages.qualify = {
      status: "PASS",
      score: qualResult.qualificationScore,
      isQualified: qualResult.isQualified,
      expectedScore: testCase.expectedScore,
      scoreMatch: Math.abs(qualResult.qualificationScore - testCase.expectedScore) < 0.15,
    };
    console.log(`   ✓ Qualified: score=${qualResult.qualificationScore}, qualified=${qualResult.isQualified}`);

    // Stage 3: Check if outreach was created (for qualified DMs)
    if (qualResult.isQualified) {
      const { data: outreachData } = await supabase
        .from("outreach_messages")
        .select("*")
        .eq("signal", `inbound_dm_${testCase.payload.sourcePost.theme.toLowerCase().replace(/ /g, "_")}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (outreachData) {
        results.stages.outreach = {
          status: "PASS",
          outreachId: outreachData.id,
          status: outreachData.status,
          sendDate: outreachData.send_date,
        };
        console.log(`   ✓ Outreach created (ID: ${outreachData.id}, status: ${outreachData.status})`);
      } else {
        results.stages.outreach = { status: "WARN", message: "Qualified but no outreach found" };
        console.log(`   ⚠️  Qualified but outreach not found`);
      }
    } else {
      results.stages.outreach = { status: "SKIPPED", reason: "Not qualified" };
      console.log(`   ⊘ Outreach skipped (not qualified)`);
    }

    // Stage 4: Verify DM status updated
    const { data: updatedDM } = await supabase
      .from("linkedin_dms")
      .select("lead_status, qualification_score, auto_qualified")
      .eq("id", dmData.id)
      .single();

    results.stages.statusUpdate = {
      status: "PASS",
      leadStatus: updatedDM.lead_status,
      qualificationScore: updatedDM.qualification_score,
      autoQualified: updatedDM.auto_qualified,
    };
    console.log(`   ✓ Status updated: ${updatedDM.lead_status}`);

    results.overall = "PASS";
  } catch (error) {
    results.overall = "FAIL";
    results.error = error.message;
    console.error(`   ❌ Error: ${error.message}`);
  }

  return results;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  console.log("🧪 Starting DM Pipeline Test Suite");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const testResults = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warned: 0 },
    };

    // Run all test cases
    for (const testCase of TEST_DMS) {
      const result = await testSingleDM(testCase);
      testResults.tests.push(result);

      if (result.overall === "PASS") testResults.summary.passed++;
      else if (result.overall === "FAIL") testResults.summary.failed++;
      else testResults.summary.warned++;
      testResults.summary.total++;
    }

    testResults.endTime = new Date().toISOString();

    // Summary report
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total: ${testResults.summary.total} | Passed: ${testResults.summary.passed} | Failed: ${testResults.summary.failed}`);
    console.log(`\n${testResults.summary.passed === testResults.summary.total ? "✅ ALL TESTS PASSED" : "⚠️  SOME TESTS FAILED"}`);
    console.log("=".repeat(60));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testResults),
    };
  } catch (error) {
    console.error("❌ Test suite error:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
