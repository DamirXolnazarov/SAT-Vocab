// supabase/functions/enrich-word/index.ts
// Receives { word } — looks up word_bank, if missing calls Claude API,
// saves to word_bank, returns full enriched word object.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { word } = await req.json()

    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: 'word is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const wordClean = word.trim().toLowerCase()

    // ── 1. Check word_bank first ─────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: existing } = await supabase
      .from('word_bank')
      .select('*')
      .ilike('word', wordClean)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ word: existing, source: 'bank' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Not found — call Claude API to enrich ─────────────────────
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!

    const prompt = `You are a SAT vocabulary expert. Given the word "${word}", return a JSON object with these exact fields and nothing else — no markdown, no explanation, just raw JSON:

{
  "word": "${word}",
  "definition": "clear, concise definition suitable for SAT prep (1-2 sentences)",
  "pronunciation": "IPA pronunciation e.g. /ɪˈfem.ər.əl/",
  "part_of_speech": "noun | verb | adjective | adverb | etc.",
  "etymology": "brief origin of the word (1 sentence)",
  "origin_story": "interesting story or context about the word's history (2-3 sentences)",
  "mnemonic_hint": "a memorable trick to remember this word (1 sentence)",
  "confusable_word": "a word commonly confused with this one",
  "confusable_explanation": "brief explanation of the difference (1 sentence)",
  "synonyms": ["syn1", "syn2", "syn3", "syn4", "syn5"],
  "antonyms": ["ant1", "ant2", "ant3", "ant4", "ant5"],
  "example_sentence_1": "a natural example sentence using the word in context",
  "example_sentence_2": "a second example sentence in a different context",
  "difficulty_rating": "easy | medium | hard"
}`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      throw new Error(`Claude API error: ${err}`)
    }

    const aiData = await aiRes.json()
    const rawText = aiData.content?.[0]?.text || ''

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/```json|```/g, '').trim()
    let enriched: Record<string, unknown>

    try {
      enriched = JSON.parse(jsonText)
    } catch {
      throw new Error(`Failed to parse Claude response: ${rawText.slice(0, 200)}`)
    }

    // ── 3. Save to word_bank ─────────────────────────────────────────
    const { data: saved, error: saveError } = await supabase
      .from('word_bank')
      .insert({
        word:                   enriched.word,
        definition:             enriched.definition,
        pronunciation:          enriched.pronunciation,
        part_of_speech:         enriched.part_of_speech,
        etymology:              enriched.etymology,
        origin_story:           enriched.origin_story,
        mnemonic_hint:          enriched.mnemonic_hint,
        confusable_word:        enriched.confusable_word,
        confusable_explanation: enriched.confusable_explanation,
        synonyms:               enriched.synonyms || [],
        antonyms:               enriched.antonyms || [],
        example_sentence_1:     enriched.example_sentence_1,
        example_sentence_2:     enriched.example_sentence_2,
        difficulty_rating:      enriched.difficulty_rating || 'medium',
        source:                 'ai',
      })
      .select()
      .single()

    if (saveError) {
      // If duplicate race condition, just return the enriched data anyway
      console.error('Save error:', saveError.message)
      return new Response(
        JSON.stringify({ word: enriched, source: 'ai' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ word: saved, source: 'ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('enrich-word error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})