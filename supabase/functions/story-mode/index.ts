// supabase/functions/story-mode/index.ts
// Input:  { words: [{ word, definition }] }
// Output: { story, highlighted_words, questions }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { words } = await req.json()

    if (!words || !Array.isArray(words) || words.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 words required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!
    const wordList = words.map((w: { word: string; definition: string }) =>
      `"${w.word}" (${w.definition})`
    ).join(', ')

    const prompt = `You are creating a SAT vocabulary learning story. 

Given these vocabulary words: ${wordList}

Write a 120-150 word engaging story that naturally uses ALL of these words. Then provide 3 multiple-choice quiz questions about how the words were used in the story.

Return ONLY a JSON object with no markdown, no explanation:
{
  "story": "the full story text here",
  "highlighted_words": [
    { "word": "ExactWordAsItAppearsInStory", "start_index": 0, "end_index": 10 }
  ],
  "questions": [
    {
      "question": "In the story, what does [word] suggest about the character?",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0
    }
  ]
}

Rules:
- Story must be engaging and age-appropriate for high school students
- Each highlighted word must have EXACT start_index and end_index matching its position in the story string (0-based, character positions)
- Questions must test understanding of the word in context, not just definition
- Generate exactly 3 questions
- correctIndex is 0-3`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API error: ${err}`)
    }

    const data   = await res.json()
    const raw    = data.content?.[0]?.text || ''
    const clean  = raw.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      throw new Error(`Failed to parse response: ${raw.slice(0, 200)}`)
    }

    // Validate and fix indices if needed
    const story = parsed.story || ''
    const highlighted = (parsed.highlighted_words || []).map(
      (hw: { word: string; start_index: number; end_index: number }) => {
        // Verify the indices match the actual word position
        const idx = story.indexOf(hw.word)
        if (idx !== -1) {
          return { word: hw.word, start_index: idx, end_index: idx + hw.word.length }
        }
        // Try case-insensitive
        const lower = story.toLowerCase().indexOf(hw.word.toLowerCase())
        if (lower !== -1) {
          return { word: story.slice(lower, lower + hw.word.length), start_index: lower, end_index: lower + hw.word.length }
        }
        return null
      }
    ).filter(Boolean)

    return new Response(
      JSON.stringify({
        story,
        highlighted_words: highlighted,
        questions: parsed.questions || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('story-mode error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})