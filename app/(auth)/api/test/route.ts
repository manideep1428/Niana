import openai from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    const res = await openai.chat.completions.create({
      model: "moonshotai/kimi-k2-instruct-0905",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "Hello! How can I help you today?" },
        { role: "user", content: prompt },
      ],
    });

    return new Response(JSON.stringify(res));
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}
