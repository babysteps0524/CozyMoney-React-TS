const ps = [
  ["GEMINI_API_KEY", "gemini"],
  ["GROQ_API_KEY", "groq"],
  ["OPENROUTER_API_KEY", "openrouter"],
];
export async function ai(prompt: string) {
  for (const [k, n] of ps) {
    let key = process.env[k];
    if (!key) continue;
    try {
      let r: any;
      if (n === "gemini") {
        r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );
        if (!r.ok) continue;
        let d = await r.json();
        return JSON.parse(d.candidates[0].content.parts[0].text);
      }
      r = await fetch(
        n === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model:
              n === "groq"
                ? "openai/gpt-oss-20b"
                : "openai/gpt-oss-120b:free",
            messages: [
              { role: "system", content: "JSON only" },
              { role: "user", content: prompt },
            ],
          }),
        },
      );
      if (!r.ok) continue;
      let d = await r.json();
      return JSON.parse(
        d.choices[0].message.content.replace(/^```json|```$/g, "").trim(),
      );
    } catch {}
  }
  throw Error("AI provider 모두 실패");
}
