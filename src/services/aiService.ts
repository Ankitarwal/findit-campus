import type { GemmaAnalysisResult, MatchComparison, ItemReport, AiStatus, ItemCategory } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';

export interface AiServiceConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
}

class AiService {
  private config: AiServiceConfig = {
    model: import.meta.env.VITE_GEMMA_MODEL || DEFAULT_GEMMA_MODEL,
    apiKey: import.meta.env.VITE_GEMMA_API_KEY || '',
    endpoint: import.meta.env.VITE_GEMMA_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions',
  };

  public getModelName(): string {
    return this.config.model;
  }

  public getStatus(): { status: AiStatus; model: string; hasKey: boolean } {
    const hasKey = Boolean(this.config.apiKey && this.config.apiKey.length > 5);
    return {
      status: hasKey ? 'connected' : 'not_configured',
      model: this.config.model,
      hasKey,
    };
  }

  public updateRuntimeConfig(newConfig: Partial<AiServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.apiKey) {
      sessionStorage.setItem('FIC_RUNTIME_GEMMA_KEY', newConfig.apiKey);
    }
  }

  constructor() {
    const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('FIC_RUNTIME_GEMMA_KEY') : null;
    if (savedKey) {
      this.config.apiKey = savedKey;
    }
  }

  /**
   * Feature A: Intelligent Description Analysis with Gemma 4
   */
  public async analyzeReport(
    title: string,
    description: string,
    category: ItemCategory,
    location: string
  ): Promise<{ analysis: GemmaAnalysisResult; usedModel: string; liveApi: boolean }> {
    // If Supabase Edge Function is deployed and active
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('match-items', {
          body: { action: 'analyze_only', reportId: 'temp', title, description, category, location },
        });
        if (!error && data?.analysis) {
          return { analysis: data.analysis, usedModel: data.model || this.config.model, liveApi: Boolean(data.gemmaConnected) };
        }
      } catch (err) {
        console.warn('Edge function invoke failed, using client-side AI pipeline:', err);
      }
    }

    // Direct Gemma 4 inference if API key is provided
    if (this.config.apiKey) {
      try {
        const prompt = `You are Google Gemma 4 serving as the intelligent campus lost & found parsing engine for FindIt Campus.
Analyze this reported campus item and return strictly a valid JSON object matching this exact schema:

{
  "normalized_title": string,
  "normalized_description": string,
  "likely_category": "${category}",
  "extracted_features": {
    "color": string | null,
    "brand": string | null,
    "model": string | null,
    "physical_traits": string[]
  },
  "keywords": string[],
  "location_references": string[],
  "uncertainty_or_missing": string[]
}

Rules:
1. Do not invent details not mentioned in the report.
2. If identifying attributes are not stated, record them under uncertainty_or_missing.
3. Keep descriptions factual and concise.

Item Data:
Title: "${title}"
Category: "${category}"
Description: "${description}"
Location: "${location}"`;

        const res = await fetch(this.config.endpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'FindIt Campus Gemma 4',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: 'You are an accurate, strict JSON extraction assistant for Google Gemma 4.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return { analysis: parsed, usedModel: this.config.model, liveApi: true };
          }
        }
      } catch (error) {
        console.error('Gemma 4 API call error:', error);
      }
    }

    // High-fidelity deterministic extraction fallback
    const fallback = this.fallbackAttributeExtraction(title, description, category, location);
    return { analysis: fallback, usedModel: `${this.config.model} (Rule Fallback Engine)`, liveApi: false };
  }

  /**
   * Feature B: Two-Stage AI Matching Pipeline
   */
  public async findMatchesForReport(
    targetReport: ItemReport,
    candidatePool: ItemReport[]
  ): Promise<MatchComparison[]> {
    const oppositeType = targetReport.report_type === 'lost' ? 'found' : 'lost';

    // Stage 1: Candidate Retrieval (Database / pool filtering)
    const stage1Candidates = candidatePool.filter(c => {
      if (c.id === targetReport.id) return false;
      if (c.report_type !== oppositeType) return false;
      if (['returned', 'closed', 'rejected', 'cancelled'].includes(c.status)) return false;

      // Candidate compatibility heuristics
      const sameCategory = c.category === targetReport.category;
      const textA = `${targetReport.title} ${targetReport.description}`.toLowerCase();
      const textB = `${c.title} ${c.description}`.toLowerCase();
      
      const commonWords = textA.split(/\s+/).filter(w => w.length > 3 && textB.includes(w));
      const hasWordOverlap = commonWords.length > 0;

      return sameCategory || hasWordOverlap;
    });

    const matches: MatchComparison[] = [];

    // Stage 2: Gemma 4 Pairwise Comparison & Hybrid Scoring
    for (const candidate of stage1Candidates) {
      const lostItem = targetReport.report_type === 'lost' ? targetReport : candidate;
      const foundItem = targetReport.report_type === 'found' ? targetReport : candidate;

      let gemmaResult: any = null;
      let liveGemma = false;

      if (this.config.apiKey) {
        try {
          const comparisonPrompt = `You are Google Gemma 4 evaluating a potential match between a LOST item and a FOUND item on campus.

Lost Item:
- Title: "${lostItem.title}"
- Category: "${lostItem.category}"
- Description: "${lostItem.description}"
- Location: "${lostItem.location}"
- Date/Time: "${lostItem.occurred_at}"

Found Item:
- Title: "${foundItem.title}"
- Category: "${foundItem.category}"
- Description: "${foundItem.description}"
- Location: "${foundItem.location}"
- Date/Time: "${foundItem.occurred_at}"

Evaluate whether these two reports likely refer to the same physical item.
Return STRICT JSON ONLY matching:
{
  "match": boolean,
  "model_score": number (0 to 100),
  "reasons": string[],
  "conflicts": string[],
  "missing_information": string[],
  "recommendation": "request_review" | "inconclusive" | "unlikely_match"
}`;

          const res = await fetch(this.config.endpoint!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model: this.config.model,
              messages: [
                { role: 'system', content: 'You are an objective campus lost & found matching engine for Google Gemma 4.' },
                { role: 'user', content: comparisonPrompt },
              ],
              temperature: 0.1,
              response_format: { type: 'json_object' },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              gemmaResult = JSON.parse(text);
              liveGemma = true;
            }
          }
        } catch (e) {
          console.warn('Gemma 4 comparison error:', e);
        }
      }

      // Hybrid calculation: deterministic rules + model relevance
      const deterministic = this.calculateDeterministicMatch(lostItem, foundItem);
      let finalScore = deterministic.score;
      let reasons = deterministic.reasons;
      let conflicts = deterministic.conflicts;
      let missingInfo = deterministic.missing;
      let recommendation = deterministic.recommendation;

      if (gemmaResult && typeof gemmaResult.model_score === 'number') {
        // Weighted hybrid formula: 45% deterministic structural validation + 55% Gemma 4 semantic understanding
        finalScore = Math.round((deterministic.score * 0.45) + (gemmaResult.model_score * 0.55));
        if (gemmaResult.reasons?.length) {
          reasons = [...new Set([...reasons, ...gemmaResult.reasons])];
        }
        if (gemmaResult.conflicts?.length) conflicts = gemmaResult.conflicts;
        if (gemmaResult.missing_information?.length) missingInfo = gemmaResult.missing_information;
        recommendation = gemmaResult.recommendation;
      }

      // Filter matches with meaningful threshold
      if (finalScore >= 40) {
        matches.push({
          id: `match-${lostItem.id}-${foundItem.id}`,
          lost_report_id: lostItem.id,
          found_report_id: foundItem.id,
          relevance_score: finalScore,
          match_reasons: reasons,
          conflicts: conflicts,
          missing_information: missingInfo,
          recommendation: recommendation,
          model_name: liveGemma ? this.config.model : `${this.config.model} (Hybrid Fallback)`,
          review_status: 'pending',
          created_at: new Date().toISOString(),
          lost_report: lostItem,
          found_report: foundItem,
        });
      }
    }

    // Sort by relevance score descending
    return matches.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  // Deterministic rule-based structural scoring
  private calculateDeterministicMatch(lost: ItemReport, found: ItemReport) {
    let score = 0;
    const reasons: string[] = [];
    const conflicts: string[] = [];
    const missing: string[] = [];

    // 1. Category check (35 points)
    if (lost.category === found.category) {
      score += 35;
      reasons.push(`Matching category: ${lost.category.replace('_', ' ')}`);
    } else {
      conflicts.push(`Different categories (${lost.category} vs ${found.category})`);
    }

    // 2. Location proximity (25 points)
    const loc1 = lost.location.toLowerCase();
    const loc2 = found.location.toLowerCase();
    if (loc1 === loc2 || loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 25;
      reasons.push(`Exact or near location match: ${lost.location}`);
    } else {
      const zones = ['library', 'cafeteria', 'canteen', 'sports', 'gym', 'lecture hall', 'hostel', 'lab', 'quad'];
      const sharedZone = zones.find(z => loc1.includes(z) && loc2.includes(z));
      if (sharedZone) {
        score += 18;
        reasons.push(`Occurred within the same campus zone (${sharedZone})`);
      } else {
        missing.push('Different reported campus locations');
      }
    }

    // 3. Date proximity (20 points)
    const d1 = new Date(lost.occurred_at).getTime();
    const d2 = new Date(found.occurred_at).getTime();
    const diffHours = Math.abs(d1 - d2) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      score += 20;
      reasons.push('Reported within 24 hours of each other');
    } else if (diffHours <= 72) {
      score += 14;
      reasons.push('Reported within 3 days of each other');
    } else if (diffHours <= 168) {
      score += 8;
      reasons.push('Reported within the same week');
    } else {
      missing.push('Reported more than 7 days apart');
    }

    // 4. Keyword token overlap (20 points)
    const text1 = `${lost.title} ${lost.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const text2 = `${found.title} ${found.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const stopWords = new Set(['the', 'and', 'with', 'from', 'this', 'that', 'near', 'have', 'lost', 'found', 'left']);
    const words1 = text1.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const words2 = text2.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const overlap = [...new Set(words1.filter(w => words2.includes(w)))];

    if (overlap.length > 0) {
      const kwPoints = Math.min(20, overlap.length * 6);
      score += kwPoints;
      reasons.push(`Shared descriptive keywords: ${overlap.slice(0, 3).join(', ')}`);
    } else {
      missing.push('No direct keyword overlap in free-form descriptions');
    }

    let recommendation: 'request_review' | 'inconclusive' | 'unlikely_match' = 'request_review';
    if (score < 50) recommendation = 'inconclusive';
    if (score < 30) recommendation = 'unlikely_match';

    return {
      score: Math.min(100, score),
      reasons,
      conflicts,
      missing,
      recommendation,
    };
  }

  // Deterministic attribute extraction fallback
  private fallbackAttributeExtraction(
    title: string,
    description: string,
    category: ItemCategory,
    location: string
  ): GemmaAnalysisResult {
    const text = `${title} ${description}`.toLowerCase();
    const colors = ['black', 'brown', 'blue', 'red', 'green', 'silver', 'white', 'grey', 'gray', 'gold', 'navy', 'yellow', 'purple'];
    const brands = ['apple', 'sony', 'samsung', 'bose', 'fossil', 'nike', 'adidas', 'titan', 'casio', 'dell', 'hp', 'lenovo', 'asus'];

    const foundColor = colors.find(c => text.includes(c)) || undefined;
    const foundBrand = brands.find(b => text.includes(b)) || undefined;

    const stopWords = new Set(['the', 'and', 'with', 'for', 'from', 'this', 'that', 'have', 'lost', 'found', 'after', 'near']);
    const words = text
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    const keywords = [...new Set(words)].slice(0, 6);

    return {
      normalized_title: title.trim(),
      normalized_description: description.trim(),
      likely_category: category,
      extracted_features: {
        color: foundColor ? foundColor.charAt(0).toUpperCase() + foundColor.slice(1) : undefined,
        brand: foundBrand ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1) : undefined,
        physical_traits: keywords.slice(0, 3),
      },
      keywords,
      location_references: [location],
      uncertainty_or_missing: ['Private serial or student ID digits withheld for security'],
    };
  }
}

export const aiService = new AiService();
