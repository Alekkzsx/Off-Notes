import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const systemPrompt = `You are an AI writing assistant for a note-taking app called Off-Notes. Help users with:
- Writing and improving their notes
- Summarizing content
- Organizing thoughts
- Creating outlines
- Answering questions about their notes
- Suggesting connections between ideas

Be concise, helpful, and focused on productivity. ${context ? `Context from current note: ${context}` : ""}`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ response })
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
