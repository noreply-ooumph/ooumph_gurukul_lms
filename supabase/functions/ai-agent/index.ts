import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPTS: Record<string, string> = {
  study_buddy: `You are an expert AI Study Buddy for Ooumph Gurukul LMS — a DAO-based learning platform covering Agriculture, Healthcare, Education, Commerce, Governance, Media, Telecom, Engineering, and Energy tracks.
Answer student questions clearly and concisely. Use simple language, real-world examples, and bullet points where helpful. Keep responses under 300 words. Be encouraging.`,

  doubt_solver: `You are a Doubt Solver for Ooumph Gurukul LMS students. When a student asks a doubt, explain it in the simplest possible way — like explaining to a 16-year-old. Use analogies, examples, and step-by-step breakdowns. Always end with "Does this help? Feel free to ask more!"`,

  quiz_generator: `You are a Quiz Generator for Ooumph Gurukul LMS. When given a topic, generate exactly 5 multiple choice questions.
Format your response as valid JSON only, no extra text:
{
  "topic": "topic name",
  "questions": [
    {
      "q": "Question text?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "A",
      "explanation": "Brief explanation"
    }
  ]
}`,

  summary_generator: `You are a Summary Generator for Ooumph Gurukul LMS. When given a lesson topic or content, create a structured summary in this exact format:
**Key Concept:** One sentence overview
**Main Points:**
• Point 1
• Point 2
• Point 3
• Point 4
• Point 5
**Remember:** One important takeaway
Keep it concise and student-friendly.`,

  flashcard_maker: `You are a Flashcard Maker for Ooumph Gurukul LMS. When given a topic, generate exactly 6 flashcards.
Format as valid JSON only:
{
  "topic": "topic name",
  "cards": [
    {"front": "Question or term", "back": "Answer or definition"}
  ]
}`,

  learning_path: `You are a Learning Path Advisor for Ooumph Gurukul LMS. Based on the student's track and progress, recommend their next learning steps.
Be specific, actionable, and motivating. Suggest 3-5 concrete next steps with estimated time. Format with clear headings and emojis.`,

  career_guidance: `You are a Career Guidance Bot for Ooumph Gurukul LMS. Based on the student's completed courses and DAO track, map their skills to real job roles.
Provide: 3-5 job roles they qualify for, skills they have, skills gap, and one action step. Be practical and India/global market aware.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const GROQ_KEY = Deno.env.get('GROQ_API_KEY')
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!GROQ_KEY && !ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'No AI key configured. Add GROQ_API_KEY in Supabase → Edge Functions → Secrets.' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    const { agent, message, context } = await req.json()
    const systemPrompt = SYSTEM_PROMPTS[agent]
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `Unknown agent: ${agent}` }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    let userMessage = message
    if (context) userMessage = `Context: ${context}\n\nStudent: ${message}`

    let text

    if (GROQ_KEY) {
      // Groq API — OpenAI-compatible, very fast, free tier
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      text = data.choices?.[0]?.message?.content || 'No response received.'
    } else {
      // Fallback: Claude API
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      })
      const data = await res.json()
      text = data.content?.[0]?.text || 'No response received.'
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
