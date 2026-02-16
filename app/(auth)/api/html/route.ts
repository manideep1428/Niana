export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = [
        `<!DOCTYPE html><html><head>
        <script src="https://cdn.tailwindcss.com"></script>
        </head><body class="bg-gray-100 flex items-center justify-center h-screen">`,

        `<div class="bg-white shadow-xl rounded-2xl p-8 w-96 transition-all duration-500">`,

        `<h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>`,

        `<form class="space-y-4">`,

        `<input type="email" placeholder="Email"
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />`,

        `<input type="password" placeholder="Password"
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />`,

        `<button type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
        Sign In
        </button>`,

        `</form></div></body></html>`,
      ];

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((res) => setTimeout(res, 700));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
