"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [html, setHtml] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <title>Messages</title>
  <style>
    body { 
      font-family: 'Inter', sans-serif;
      width: 375px;
      max-width: 428px;
      margin: 0 auto;
      background: #f9fafb;
    }
    * {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    *::-webkit-scrollbar {
      display: none;
    }
  </style>
</head>
<body class="bg-white flex flex-col h-screen text-gray-900">
  <!-- Header -->
  <header class="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100 bg-white">
    <div class="flex items-center gap-2">
      <button class="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 bg-gray-100">
        <i class="fa-solid fa-arrow-left text-sm"></i>
      </button>
      <div class="flex flex-col">
        <span class="text-base font-semibold">Messages</span>
        <span class="text-[11px] text-gray-500">Collaborate with your network</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button class="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 bg-gray-100">
        <i class="fa-regular fa-pen-to-square text-sm"></i>
      </button>
    </div>
  </header>

  <!-- Search -->
  <section class="px-4 pt-2 pb-2 border-b border-gray-100 bg-white">
    <div class="flex items-center gap-2">
      <div class="flex-1 h-9 rounded-full bg-gray-100 flex items-center px-3 gap-2 text-gray-500 text-sm">
        <i class="fa-solid fa-magnifying-glass text-xs"></i>
        <input type="text" placeholder="Search messages" class="bg-transparent border-0 outline-none text-xs flex-1 placeholder:text-gray-400" />
      </div>
      <button class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm">
        <i class="fa-solid fa-sliders"></i>
      </button>
    </div>
  </section>

  <!-- Conversation filters -->
  <section class="px-4 pt-2 pb-2 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto">
    <button class="px-3 h-8 rounded-full bg-gray-900 text-white text-[11px] font-medium flex items-center gap-1">
      <span>All</span>
    </button>
    <button class="px-3 h-8 rounded-full bg-gray-100 text-gray-800 text-[11px] font-medium flex items-center gap-1">
      <span>Unread</span>
    </button>
    <button class="px-3 h-8 rounded-full bg-gray-100 text-gray-800 text-[11px] font-medium flex items-center gap-1">
      <span>Pinned</span>
    </button>
    <button class="px-3 h-8 rounded-full bg-gray-100 text-gray-800 text-[11px] font-medium flex items-center gap-1">
      <span>Groups</span>
    </button>
  </section>

  <!-- Conversation list -->
  <main class="flex-1 overflow-y-auto bg-gray-50 pb-16">
    <div class="pt-1 pb-4 divide-y divide-gray-100">
      <!-- Conversation 1 -->
      <div class="px-4 py-3 bg-white flex items-center gap-3">
        <div class="relative flex-shrink-0">
          <img src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200" class="w-11 h-11 rounded-full object-cover" alt="Avatar" />
          <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 truncate">Alex Parker</p>
            <span class="text-[11px] text-gray-400">2:18 PM</span>
          </div>
          <p class="text-xs text-gray-600 truncate">Sending over the updated flow with the simplified navigation we discussed.</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="px-2 h-5 rounded-full bg-indigo-50 text-[10px] text-indigo-600 font-medium flex items-center">Case Study</span>
            <span class="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-semibold">3</span>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-[10px] text-gray-300"></i>
      </div>

      <!-- Conversation 2 (group) -->
      <div class="px-4 py-3 bg-white flex items-center gap-3">
        <div class="flex-shrink-0 relative">
          <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold">UX</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 truncate">UX Weekly • Panel</p>
            <span class="text-[11px] text-gray-400">11:03 AM</span>
          </div>
          <p class="text-xs text-gray-600 truncate"><span class="font-semibold">you:</span> I can share the onboarding benchmarks after the call.</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-[11px] text-gray-400">4 members</span>
          </div>
        </div>
        <i class="fa-solid fa-thumbtack text-[10px] text-gray-300 rotate-45"></i>
      </div>

      <!-- Conversation 3 -->
      <div class="px-4 py-3 bg-white flex items-center gap-3">
        <div class="relative flex-shrink-0">
          <img src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200" class="w-11 h-11 rounded-full object-cover" alt="Avatar" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 truncate">Marie Codeaux</p>
            <span class="text-[11px] text-gray-400">Yesterday</span>
          </div>
          <p class="text-xs text-gray-600 truncate">That layout works beautifully on smaller screens. Love the spacing.</p>
        </div>
      </div>

      <!-- Conversation 4 -->
      <div class="px-4 py-3 bg-white flex items-center gap-3">
        <div class="relative flex-shrink-0">
          <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200" class="w-11 h-11 rounded-full object-cover" alt="Avatar" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 truncate">Studio One</p>
            <span class="text-[11px] text-gray-400">Mon</span>
          </div>
          <p class="text-xs text-gray-600 truncate">Here’s the moodboard for the next collaboration. Let us know what resonates.</p>
        </div>
      </div>

      <!-- Conversation 5 (unread) -->
      <div class="px-4 py-3 bg-white flex items-center gap-3">
        <div class="relative flex-shrink-0">
          <img src="https://images.pexels.com/photos/374710/pexels-photo-374710.jpeg?auto=compress&cs=tinysrgb&w=200" class="w-11 h-11 rounded-full object-cover" alt="Avatar" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 truncate">North Team</p>
            <span class="text-[11px] text-indigo-500 font-medium">2 new</span>
          </div>
          <p class="text-xs text-gray-800 truncate font-medium">Can you join a quick sync to walk through the prototype interactions?</p>
        </div>
        <span class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
      </div>
    </div>
  </main>

  <!-- Bottom tab bar -->
  <nav class="h-14 border-t border-gray-200 bg-white flex items-center justify-between px-8 text-xs text-gray-500">
    <button class="flex flex-col items-center justify-center">
      <i class="fa-solid fa-house text-lg mb-0.5"></i>
      <span class="text-[11px] font-medium">Feed</span>
    </button>
    <button class="flex flex-col items-center justify-center">
      <i class="fa-regular fa-compass text-lg mb-0.5"></i>
      <span class="text-[11px] font-medium">Discover</span>
    </button>
    <button class="flex flex-col items-center justify-center -mt-5">
      <div class="w-11 h-11 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
        <i class="fa-solid fa-plus text-lg"></i>
      </div>
    </button>
    <button class="flex flex-col items-center justify-center text-indigo-500">
      <i class="fa-solid fa-message text-lg mb-0.5"></i>
      <span class="text-[11px] font-medium">Messages</span>
    </button>
    <button class="flex flex-col items-center justify-center">
      <i class="fa-regular fa-user text-lg mb-0.5"></i>
      <span class="text-[11px] font-medium">Profile</span>
    </button>
  </nav>
</body>
</html>`);

  const [apiKey, setApiKey] = useState("");
  const [clip, setClip] = useState(true);
  const [topLayerName, setTopLayerName] = useState("");
  const [noAutoLayout, setNoAutoLayout] = useState(false);
  const [fullsizeImages, setFullsizeImages] = useState(false);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    setCopied(false);

    const body: Record<string, unknown> = {
      html,
      clip,
      noAutoLayout,
      fullsizeImages,
      width,
      height,
      theme,
    };

    if (topLayerName.trim()) {
      body.topLayerName = topLayerName.trim();
    }

    try {
      const res = await fetch("https://api.to.design/html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      // Get response as text first since clipboard mode returns non-JSON data
      const text = await res.text();

      if (!res.ok) {
        // Try to parse error as JSON
        try {
          const errorData = JSON.parse(text);
          setError(
            errorData.title || errorData.message || "Something went wrong"
          );
        } catch {
          setError(text || `Error: ${res.status} ${res.statusText}`);
        }
      } else {
        // Success - the clipboard data is ready to copy
        console.log(text);
        setResponse(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Ref to store clipboard data for the copy event listener
  const clipboardDataRef = useRef<string | null>(null);

  // Set up copy event listener for Figma clipboard format
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (clipboardDataRef.current) {
        e.clipboardData?.setData("text/html", clipboardDataRef.current);
        e.preventDefault();
        clipboardDataRef.current = null;
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  const handleCopyToClipboard = () => {
    if (!response) return;

    // Store the clipboard data
    clipboardDataRef.current = response;

    // Trigger the copy event
    document.execCommand("copy");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/80">code.to.design API</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            HTML to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Figma
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Convert your HTML code into Figma designs instantly. Paste your
            HTML, configure options, and copy to clipboard.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* API Key */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="zpka_xxxxx_xxxxx"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              <p className="text-xs text-white/40 mt-2">
                Get your API key from{" "}
                <a
                  href="https://code.to.design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  code.to.design
                </a>
              </p>
            </div>

            {/* HTML Input */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                HTML Code
              </label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={16}
                className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white/90 font-mono text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                placeholder="Paste your HTML code here..."
              />
            </div>
          </div>

          {/* Right Panel - Options & Output */}
          <div className="space-y-6">
            {/* Options */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Options</h3>

              {/* Top Layer Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Top Layer Name (optional)
                </label>
                <input
                  type="text"
                  value={topLayerName}
                  onChange={(e) => setTopLayerName(e.target.value)}
                  placeholder="My Design"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                />
              </div>

              {/* Viewport Size */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Width
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Height
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Theme */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Theme
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      theme === "light"
                        ? "bg-white text-slate-900"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    ☀️ Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      theme === "dark"
                        ? "bg-slate-800 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={clip}
                      onChange={(e) => setClip(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/20 rounded-full peer-checked:bg-purple-500 transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    Clipboard Mode
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={noAutoLayout}
                      onChange={(e) => setNoAutoLayout(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/20 rounded-full peer-checked:bg-purple-500 transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    No Auto Layout
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={fullsizeImages}
                      onChange={(e) => setFullsizeImages(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/20 rounded-full peer-checked:bg-purple-500 transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    Full Size Images
                  </span>
                </label>
              </div>
            </div>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={loading || !apiKey || !html.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Convert to Figma
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-red-400 font-medium">Error</p>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Success Response with Copy Button */}
            {response && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold">
                        Conversion Successful!
                      </p>
                      <p className="text-green-300/70 text-sm">
                        {clip
                          ? "Copy the data and paste in Figma"
                          : "Check your Figma plugin"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copy to Clipboard Button */}
                {clip && (
                  <button
                    onClick={handleCopyToClipboard}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                )}

                {/* Response Preview */}
                <div className="bg-slate-900/50 rounded-xl p-4 max-h-48 overflow-auto">
                  <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap break-all">
                    {response.length > 500 ? response : response}
                  </pre>
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <p className="text-white/80 text-sm font-medium">
                    How to paste in Figma:
                  </p>
                  <ol className="text-white/60 text-sm space-y-1 list-decimal list-inside">
                    <li>Click &quot;Copy to Clipboard&quot; above</li>
                    <li>Open Figma</li>
                    <li>
                      Press{" "}
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                        Ctrl/Cmd + V
                      </kbd>{" "}
                      to paste
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t border-white/10">
          <p className="text-white/40 text-sm">
            Powered by{" "}
            <a
              href="https://code.to.design"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              code.to.design
            </a>{" "}
            API
          </p>
        </div>
      </div>
    </div>
  );
}
