import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { selectedCode, prompt, fileContent, language } = await req.json();

    if (!selectedCode || !prompt) {
      return NextResponse.json(
        { error: "Selected code and prompt are required" },
        { status: 400 }
      );
    }

    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    const ollamaModel = "gpt-oss:120b-cloud";

    const systemPrompt = `You are an expert code assistant. The user has selected a piece of code and wants you to modify it based on their request.

IMPORTANT RULES:
1. ONLY return the modified code, nothing else
2. Do NOT include explanations, markdown formatting, or code blocks
3. Do NOT include the original code unless modified
4. Preserve the indentation and formatting style
5. If the request is unclear or cannot be fulfilled, return the original code unchanged

Language: ${language || "unknown"}
User's request: ${prompt}

Selected code to modify:
\`\`\`
${selectedCode}
\`\`\`

File context (for reference):
\`\`\`
${fileContent.substring(0, 2000)}
\`\`\`

Return ONLY the modified code:`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ollamaApiKey && { Authorization: `Bearer ${ollamaApiKey}` }),
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    let modifiedCode = data.response || "";

    // Clean up the response - remove markdown code blocks if present
    modifiedCode = modifiedCode
      .replace(/^```[\w]*\n/gm, "")
      .replace(/\n```$/gm, "")
      .trim();

    return NextResponse.json({
      modifiedCode,
      success: true,
    });
  } catch (error) {
    console.error("Code action API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate code modification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
