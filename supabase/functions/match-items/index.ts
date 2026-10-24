// Supabase Edge Function: match-items
// Integrates Google Gemma 4 for intelligent campus lost & found matching

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchRequest {
  reportId: string;
  action: 'analyze_and_match' | 'analyze_only' | 'compare_pair';
  targetPairId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const gemmaApiKey = Deno.env.get("GEMMA_API_KEY") ?? "";
    const gemmaModel = Deno.env.get("GEMMA_MODEL") ?? "gemma-4-26b-a4b-it";
    const gemmaEndpoint = Deno.env.get("GEMMA_API_ENDPOINT") ?? "https://openrouter.ai/api/v1/chat/completions";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: MatchRequest = await req.json();
    const { reportId, action, targetPairId } = body;

    if (!reportId) {
      return new Response(JSON.stringify({ error: "reportId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrieve target report
    const { data: report, error: reportErr } = await supabase
      .from("item_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportErr || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- STEP 1: Intelligent Description Analysis with Gemma 4 ---
    let aiAnalysis = report.ai_analysis;
    let gemmaConnected = false;

    if (!aiAnalysis || action === "analyze_only") {
      if (gemmaApiKey) {
        try {
          const analysisPrompt = `You are an AI assistant specialized in campus lost & found item categorization and attribute extraction for FindIt Campus.
Analyze the following item report and output strictly a valid JSON object matching the schema below. Do not invent details not mentioned in the text.

Item Title: "${report.title}"
Item Category: "${report.category}"
Item Description: "${report.description}"
Location: "${report.location}"

Output JSON schema:
{
  "normalized_title": string,
  "normalized_description": string,
  "likely_category": string,
  "extracted_features": {
    "color": string | null,
    "brand": string | null,
    "model": string | null,
    "physical_traits": string[]
  },
  "keywords": string[],
  "location_references": string[],
  "uncertainty_or_missing": string[]
}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const aiResp = await fetch(gemmaEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${gemmaApiKey}`,
              "HTTP-Referer": "https://finditcampus.edu",
              "X-Title": "FindIt Campus AI",
            },
            body: JSON.stringify({
              model: gemmaModel,
              messages: [
                { role: "system", content: "You are an accurate, strict JSON extraction assistant for Google Gemma 4." },
                { role: "user", content: analysisPrompt }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              aiAnalysis = JSON.parse(content);
              gemmaConnected = true;
            }
          }
        } catch (e) {
          console.error("Gemma analysis API error:", e);
        }
      }

      // Safe deterministic fallback if Gemma 4 call failed or not configured
      if (!aiAnalysis) {
        aiAnalysis = fallbackAnalyze(report.title, report.description, report.category, report.location);
      }

      // Update report with analysis
      await supabase
        .from("item_reports")
        .update({ ai_analysis: aiAnalysis, updated_at: new Date().toISOString() })
        .eq("id", reportId);
    }

    if (action === "analyze_only") {
      return new Response(JSON.stringify({ 
        success: true, 
        analysis: aiAnalysis, 
        model: gemmaModel, 
        gemmaConnected 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- STEP 2: Candidate Retrieval (Stage 1) ---
    const oppositeType = report.report_type === "lost" ? "found" : "lost";
    const { data: candidates, error: candErr } = await supabase
      .from("item_reports")
      .select("id, title, description, category, location, occurred_at, status")
      .eq("report_type", oppositeType)
      .neq("status", "returned")
      .neq("status", "closed")
      .neq("status", "rejected")
      .limit(15);

    if (candErr || !candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matches: [], 
        message: "No candidate opposite-type reports found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter candidates if targetPairId requested
    const filteredCandidates = targetPairId 
      ? candidates.filter(c => c.id === targetPairId)
      : candidates;

    // --- STEP 3: Gemma 4 Pairwise Comparison & Hybrid Scoring (Stage 2) ---
    const matchesFound = [];

    for (const candidate of filteredCandidates) {
      let comparisonResult = null;

      if (gemmaApiKey) {
        try {
          const comparisonPrompt = `You are the Google Gemma 4 verification engine for FindIt Campus.
Compare the following two campus item reports: one LOST and one FOUND.
Evaluate whether they could refer to the same physical item.

Lost Report:
- Title: "${report.report_type === 'lost' ? report.title : candidate.title}"
- Category: "${report.report_type === 'lost' ? report.category : candidate.category}"
- Description: "${report.report_type === 'lost' ? report.description : candidate.description}"
- Location: "${report.report_type === 'lost' ? report.location : candidate.location}"
- Date/Time: "${report.report_type === 'lost' ? report.occurred_at : candidate.occurred_at}"

Found Report:
- Title: "${report.report_type === 'found' ? report.title : candidate.title}"
- Category: "${report.report_type === 'found' ? report.category : candidate.category}"
- Description: "${report.report_type === 'found' ? report.description : candidate.description}"
- Location: "${report.report_type === 'found' ? report.location : candidate.location}"
- Date/Time: "${report.report_type === 'found' ? report.occurred_at : candidate.occurred_at}"

Return STRICT JSON only:
{
  "match": boolean,
  "model_score": number (0 to 100),
  "reasons": string[],
  "conflicts": string[],
  "missing_information": string[],
  "recommendation": "request_review" | "inconclusive" | "unlikely_match"
}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const compResp = await fetch(gemmaEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${gemmaApiKey}`,
              "HTTP-Referer": "https://finditcampus.edu",
              "X-Title": "FindIt Campus AI",
            },
            body: JSON.stringify({
              model: gemmaModel,
              messages: [
                { role: "system", content: "You are an objective lost & found comparison engine for Google Gemma 4." },
                { role: "user", content: comparisonPrompt }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (compResp.ok) {
            const compData = await compResp.json();
            const text = compData.choices?.[0]?.message?.content;
            if (text) {
              comparisonResult = JSON.parse(text);
              gemmaConnected = true;
            }
          }
        } catch (e) {
          console.error("Gemma pairwise comparison error:", e);
        }
      }

      // Hybrid calculation combining deterministic rule score + model score
      const deterministic = calculateDeterministicScore(report, candidate);
      let finalScore = deterministic.score;
      let reasons = deterministic.reasons;
      let conflicts = deterministic.conflicts;
      let missingInfo = deterministic.missing;
      let recommendation = deterministic.recommendation;

      if (comparisonResult && typeof comparisonResult.model_score === "number") {
        // Weighted formula: 45% deterministic structural compatibility + 55% Gemma 4 semantic similarity
        finalScore = Math.round((deterministic.score * 0.45) + (comparisonResult.model_score * 0.55));
        if (comparisonResult.reasons?.length) reasons = [...new Set([...reasons, ...comparisonResult.reasons])];
        if (comparisonResult.conflicts?.length) conflicts = comparisonResult.conflicts;
        if (comparisonResult.missing_information?.length) missingInfo = comparisonResult.missing_information;
        recommendation = comparisonResult.recommendation;
      }

      // Filter to relevant candidates with score threshold >= 40
      if (finalScore >= 40) {
        const lostId = report.report_type === "lost" ? report.id : candidate.id;
        const foundId = report.report_type === "found" ? report.id : candidate.id;

        // Upsert match into item_matches
        const { data: savedMatch, error: matchInsertErr } = await supabase
          .from("item_matches")
          .upsert({
            lost_report_id: lostId,
            found_report_id: foundId,
            relevance_score: finalScore,
            match_reasons: reasons,
            conflicts: conflicts,
            missing_information: missingInfo,
            recommendation: recommendation,
            model_name: gemmaModel,
            review_status: "pending",
            created_at: new Date().toISOString()
          }, { onConflict: "lost_report_id,found_report_id" })
          .select()
          .single();

        if (!matchInsertErr && savedMatch) {
          matchesFound.push(savedMatch);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      matches: matchesFound,
      modelUsed: gemmaModel,
      gemmaConnected,
      evaluatedCandidatesCount: filteredCandidates.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Deterministic attribute extraction fallback
function fallbackAnalyze(title: string, desc: string, category: string, location: string) {
  const text = `${title} ${desc}`.toLowerCase();
  
  const colors = ["black", "brown", "blue", "red", "green", "silver", "white", "grey", "gray", "gold", "navy", "yellow"];
  const brands = ["apple", "sony", "samsung", "bose", "dell", "hp", "lenovo", "casio", "nike", "adidas", "fossil", "titan"];
  
  const foundColor = colors.find(c => text.includes(c)) || null;
  const foundBrand = brands.find(b => text.includes(b)) || null;

  const words = text.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const uniqueKeywords = [...new Set(words)].slice(0, 6);

  return {
    normalized_title: title.trim(),
    normalized_description: desc.trim(),
    likely_category: category,
    extracted_features: {
      color: foundColor,
      brand: foundBrand,
      model: null,
      physical_traits: uniqueKeywords.slice(0, 3)
    },
    keywords: uniqueKeywords,
    location_references: [location],
    uncertainty_or_missing: ["Exact serial/identification numbers omitted for privacy"]
  };
}

// Deterministic hybrid scoring algorithm
function calculateDeterministicScore(r1: any, r2: any) {
  let score = 0;
  const reasons: string[] = [];
  const conflicts: string[] = [];
  const missing: string[] = [];

  // Category compatibility (35 pts)
  if (r1.category === r2.category) {
    score += 35;
    reasons.push(`Matching category: ${r1.category.replace('_', ' ')}`);
  } else {
    conflicts.push(`Different categories (${r1.category} vs ${r2.category})`);
  }

  // Location proximity (25 pts)
  const loc1 = r1.location.toLowerCase();
  const loc2 = r2.location.toLowerCase();
  if (loc1 === loc2 || loc1.includes(loc2) || loc2.includes(loc1)) {
    score += 25;
    reasons.push(`Matching location area (${r1.location})`);
  } else {
    const zones = ["library", "cafeteria", "canteen", "sports", "gym", "hostel", "hall", "lab"];
    const sharedZone = zones.find(z => loc1.includes(z) && loc2.includes(z));
    if (sharedZone) {
      score += 18;
      reasons.push(`Shared campus zone: ${sharedZone}`);
    } else {
      missing.push("Different reported campus locations");
    }
  }

  // Temporal proximity (20 pts)
  const d1 = new Date(r1.occurred_at).getTime();
  const d2 = new Date(r2.occurred_at).getTime();
  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
  if (diffDays <= 2) {
    score += 20;
    reasons.push("Reported within 48 hours of each other");
  } else if (diffDays <= 7) {
    score += 12;
    reasons.push("Reported within the same week");
  } else {
    missing.push("Reported more than 7 days apart");
  }

  // Title / text token overlap (20 pts)
  const words1 = `${r1.title} ${r1.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const words2 = `${r2.title} ${r2.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const overlap = words1.filter(w => words2.includes(w));
  const uniqueOverlap = [...new Set(overlap)];

  if (uniqueOverlap.length > 0) {
    const tokenScore = Math.min(20, uniqueOverlap.length * 6);
    score += tokenScore;
    reasons.push(`Overlapping descriptive keywords: ${uniqueOverlap.slice(0, 3).join(", ")}`);
  } else {
    missing.push("No specific keyword overlap in free-form descriptions");
  }

  let recommendation: "request_review" | "inconclusive" | "unlikely_match" = "request_review";
  if (score < 50) recommendation = "inconclusive";
  if (score < 30) recommendation = "unlikely_match";

  return {
    score: Math.min(100, score),
    reasons,
    conflicts,
    missing,
    recommendation
  };
}
