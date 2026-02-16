"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";

export default function GradientThemeEngine() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [activeTheme, setActiveTheme] = useState("Cosmic Night");
  const [activeFont, setActiveFont] = useState("inter");

  const themes = {
    "Cosmic Night": {
      bg: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
      card: "linear-gradient(135deg,#1e293b,#0f172a)",
      text: "#e0e7ff",
      muted: "#94a3b8",
      primary: "linear-gradient(135deg,#8b5cf6,#6366f1)",
      primarySolid: "#8b5cf6",
    },
    "Sunset Flow": {
      bg: "linear-gradient(135deg,#7c2d12,#ea580c,#f97316)",
      card: "linear-gradient(135deg,#1c1917,#292524)",
      text: "#fff7ed",
      muted: "#fed7aa",
      primary: "linear-gradient(135deg,#f97316,#fb923c)",
      primarySolid: "#f97316",
    },
    "Ocean Depth": {
      bg: "linear-gradient(135deg,#0c4a6e,#075985,#0369a1)",
      card: "linear-gradient(135deg,#082f49,#0c4a6e)",
      text: "#e0f2fe",
      muted: "#7dd3fc",
      primary: "linear-gradient(135deg,#06b6d4,#3b82f6)",
      primarySolid: "#06b6d4",
    },
  };

  const fonts = {
    inter: {
      family: "Inter, sans-serif",
      url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
    },
    poppins: {
      family: "Poppins, sans-serif",
      url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
    },
  };

  /* --------------------------------------------------- */
  /* STATIC HTML (NO DYNAMIC TOKENS INSIDE)             */
  /* --------------------------------------------------- */

  const iframeHTML = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<script src="https://cdn.tailwindcss.com"></script>

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
rel="stylesheet">

<style>
.theme-default {
  --bg: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 55%, rgba(255,255,255,1) 100%);
  --surface: rgba(255,255,255,0.72);
  --border: rgba(15, 23, 42, 0.10);
  --text: rgba(15, 23, 42, 0.92);
  --muted: rgba(15, 23, 42, 0.62);
  --primary: rgba(34, 197, 94, 1);
  --primary-gradient: linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(16,185,129,1) 45%, rgba(14,165,233,1) 100%);
  --shadow: 0 18px 45px rgba(2, 6, 23, 0.14);
  --radius: 18px;
  --font: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}

body {
  font-family: var(--font);
  width: 1024px;
  margin: 0 auto;
  background: var(--bg);
}
</style>
</head>

<body class="theme-default flex flex-col min-h-screen text-[var(--text)]">
<header class="px-10 pt-8">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="h-11 w-11 rounded-[14px] flex items-center justify-center border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 10px 25px rgba(2, 6, 23, 0.08);">
        <i class="fa-solid fa-bowl-food text-[var(--text)]"></i>
      </div>
      <div>
        <div class="text-sm font-extrabold tracking-tight">FreshDrop</div>
        <div class="text-xs text-[var(--muted)]">Food delivery, made delightful</div>
      </div>
    </div>

    <nav class="flex items-center gap-6 text-sm">
      <a class="text-[var(--muted)] hover:text-[var(--text)]" href="#">Restaurants</a>
      <a class="text-[var(--muted)] hover:text-[var(--text)]" href="#">Offers</a>
      <a class="text-[var(--muted)] hover:text-[var(--text)]" href="#">How it works</a>
      <a class="text-[var(--muted)] hover:text-[var(--text)]" href="#">Support</a>
    </nav>

    <div class="flex items-center gap-3">
      <a href="#" class="px-4 py-2 rounded-[12px] border border-[var(--border)] bg-[var(--card-bg)] text-sm font-semibold" style="box-shadow: 0 10px 25px rgba(2, 6, 23, 0.06);">Sign in</a>
      <a href="#" class="px-4 py-2 rounded-[12px] text-sm font-semibold text-white" style="background: var(--primary-gradient); box-shadow: 0 18px 45px rgba(2, 6, 23, 0.14);">Get the app</a>
    </div>
  </div>
</header>

<main class="flex-1 px-10 pb-10">
  <section class="mt-10 grid grid-cols-12 gap-8 items-stretch">
    <!-- Left: Hero copy -->
    <div class="col-span-7">
      <div class="p-9 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" style="box-shadow: var(--shadow); backdrop-filter: blur(10px);">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--muted)]">
          <span class="h-2 w-2 rounded-full" style="background: var(--primary);"></span>
          <span>Fast delivery • Live tracking • Curated restaurants</span>
        </div>

        <h1 class="mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight">
          Your next meal,
          <span class="block" style="background: var(--primary-gradient); -webkit-background-clip: text; background-clip: text; color: transparent;">delivered warm & on time</span>
        </h1>

        <p class="mt-5 text-[15px] leading-7 text-[var(--muted)] max-w-xl">
          Discover local favorites, reorder in one tap, and track your courier from kitchen to doorstep.
          FreshDrop brings restaurants, groceries, and late-night cravings together in one place.
        </p>

        <!-- Search card -->
        <div class="mt-7 p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.10);">
          <div class="flex items-center gap-3">
            <div class="h-11 w-11 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
              <i class="fa-solid fa-location-dot text-[var(--muted)]"></i>
            </div>
            <div class="flex-1">
              <div class="text-xs font-semibold text-[var(--muted)]">Deliver to</div>
              <div class="mt-1 flex items-center justify-between gap-4">
                <div class="text-sm font-semibold">123 Market Street, Downtown</div>
                <span class="text-xs text-[var(--muted)]">Change</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <div class="relative flex-1">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <i class="fa-solid fa-magnifying-glass"></i>
              </div>
              <input
                class="w-full pl-11 pr-4 py-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] text-sm outline-none"
                style="box-shadow: 0 10px 20px rgba(2, 6, 23, 0.06);"
                placeholder="Search pizza, sushi, burgers…"
                aria-label="Search for food"
              />
            </div>
            <a href="#" class="px-5 py-3 rounded-[14px] text-sm font-semibold text-white whitespace-nowrap" style="background: var(--primary-gradient); box-shadow: 0 18px 45px rgba(2, 6, 23, 0.14);">
              Find food
            </a>
          </div>

          <div class="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span class="font-semibold">Popular:</span>
            <a href="#" class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">Salads</a>
            <a href="#" class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">Tacos</a>
            <a href="#" class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">Bubble tea</a>
            <a href="#" class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">Groceries</a>
          </div>
        </div>

        <!-- Trust row -->
        <div class="mt-7 grid grid-cols-3 gap-4">
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-[14px] flex items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
                <i class="fa-solid fa-bolt text-[var(--muted)]"></i>
              </div>
              <div>
                <div class="text-sm font-bold">25–35 min</div>
                <div class="text-xs text-[var(--muted)]">Average delivery</div>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-[14px] flex items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
                <i class="fa-solid fa-star text-[var(--muted)]"></i>
              </div>
              <div>
                <div class="text-sm font-bold">4.8 rating</div>
                <div class="text-xs text-[var(--muted)]">From happy eaters</div>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-[14px] flex items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
                <i class="fa-solid fa-shield-heart text-[var(--muted)]"></i>
              </div>
              <div>
                <div class="text-sm font-bold">Secure checkout</div>
                <div class="text-xs text-[var(--muted)]">Trusted payments</div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA row -->
        <div class="mt-8 flex items-center gap-4">
          <a href="#" class="px-6 py-3 rounded-[14px] text-sm font-semibold text-white" style="background: var(--primary-gradient); box-shadow: var(--shadow);">
            Order now
          </a>
          <a href="#" class="px-6 py-3 rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] text-sm font-semibold" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            Explore restaurants
          </a>
          <div class="ml-auto flex items-center gap-3 text-xs text-[var(--muted)]">
            <div class="flex -space-x-2">
              <div class="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)]"></div>
              <div class="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)]"></div>
              <div class="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)]"></div>
            </div>
            <span><span class="font-bold text-[var(--text)]">12k+</span> orders today</span>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="mt-8 grid grid-cols-3 gap-4">
        <div class="p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
          <div class="h-11 w-11 rounded-[14px] flex items-center justify-center text-white" style="background: var(--primary-gradient);">
            <i class="fa-solid fa-utensils"></i>
          </div>
          <div class="mt-4 text-sm font-bold">Pick a place</div>
          <div class="mt-1 text-xs leading-5 text-[var(--muted)]">Browse menus, ratings, and estimated delivery times.</div>
        </div>
        <div class="p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
          <div class="h-11 w-11 rounded-[14px] flex items-center justify-center text-white" style="background: var(--primary-gradient);">
            <i class="fa-solid fa-bag-shopping"></i>
          </div>
          <div class="mt-4 text-sm font-bold">Add to cart</div>
          <div class="mt-1 text-xs leading-5 text-[var(--muted)]">Customize items and save favorites for next time.</div>
        </div>
        <div class="p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
          <div class="h-11 w-11 rounded-[14px] flex items-center justify-center text-white" style="background: var(--primary-gradient);">
            <i class="fa-solid fa-motorcycle"></i>
          </div>
          <div class="mt-4 text-sm font-bold">Track delivery</div>
          <div class="mt-1 text-xs leading-5 text-[var(--muted)]">Get live updates from preparation to doorstep.</div>
        </div>
      </div>
    </div>

    <!-- Right: Visual / preview card -->
    <div class="col-span-5">
      <div class="h-full p-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" style="box-shadow: var(--shadow); backdrop-filter: blur(10px);">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-extrabold">Today’s picks</div>
            <div class="text-xs text-[var(--muted)]">Top-rated near you</div>
          </div>
          <a href="#" class="text-xs font-semibold text-[var(--muted)]">View all</a>
        </div>

        <!-- Featured banner -->
        <div class="mt-5 p-5 rounded-[18px] border border-[var(--border)] text-white" style="background: var(--primary-gradient); box-shadow: 0 18px 45px rgba(2, 6, 23, 0.16);">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs font-semibold opacity-95">Limited-time offer</div>
              <div class="mt-1 text-2xl font-extrabold leading-tight">Free delivery<br/>on your first order</div>
              <div class="mt-2 text-xs opacity-90">Use code: FIRSTBITE</div>
            </div>
            <div class="h-14 w-14 rounded-[16px] bg-white/15 border border-white/20 flex items-center justify-center">
              <i class="fa-solid fa-ticket text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Restaurant cards -->
        <div class="mt-5 space-y-4">
          <article class="p-4 rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex gap-4">
              <div class="h-16 w-16 rounded-[16px] border border-[var(--border)]" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(15, 23, 42, 0.06));"></div>
              <div class="flex-1">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="text-sm font-extrabold">Green Bowl Co.</div>
                    <div class="mt-0.5 text-xs text-[var(--muted)]">Salads • Smoothies • Healthy</div>
                  </div>
                  <div class="text-xs font-bold">4.9 <span class="text-[var(--muted)] font-semibold">★</span></div>
                </div>
                <div class="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">25–35 min</span>
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">$0 delivery</span>
                  <span class="ml-auto font-semibold text-[var(--text)]">from $12</span>
                </div>
              </div>
            </div>
          </article>

          <article class="p-4 rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex gap-4">
              <div class="h-16 w-16 rounded-[16px] border border-[var(--border)]" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(15, 23, 42, 0.06));"></div>
              <div class="flex-1">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="text-sm font-extrabold">Firestone Pizza</div>
                    <div class="mt-0.5 text-xs text-[var(--muted)]">Pizza • Italian • Family</div>
                  </div>
                  <div class="text-xs font-bold">4.7 <span class="text-[var(--muted)] font-semibold">★</span></div>
                </div>
                <div class="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">30–45 min</span>
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">$2.99 delivery</span>
                  <span class="ml-auto font-semibold text-[var(--text)]">from $15</span>
                </div>
              </div>
            </div>
          </article>

          <article class="p-4 rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08);">
            <div class="flex gap-4">
              <div class="h-16 w-16 rounded-[16px] border border-[var(--border)]" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(15, 23, 42, 0.06));"></div>
              <div class="flex-1">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="text-sm font-extrabold">Sushi Lane</div>
                    <div class="mt-0.5 text-xs text-[var(--muted)]">Sushi • Japanese • Bento</div>
                  </div>
                  <div class="text-xs font-bold">4.8 <span class="text-[var(--muted)] font-semibold">★</span></div>
                </div>
                <div class="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">20–30 min</span>
                  <span class="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)]">$1.99 delivery</span>
                  <span class="ml-auto font-semibold text-[var(--text)]">from $18</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Mini stats -->
        <div class="mt-6 grid grid-cols-3 gap-3">
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.06);">
            <div class="text-xs text-[var(--muted)]">Restaurants</div>
            <div class="mt-1 text-lg font-extrabold">1,200+</div>
          </div>
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.06);">
            <div class="text-xs text-[var(--muted)]">Avg. fee</div>
            <div class="mt-1 text-lg font-extrabold">$1.90</div>
          </div>
          <div class="p-4 rounded-[16px] border border-[var(--border)] bg-[var(--card-bg)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.06);">
            <div class="text-xs text-[var(--muted)]">Support</div>
            <div class="mt-1 text-lg font-extrabold">24/7</div>
          </div>
        </div>

        <!-- App badges -->
        <div class="mt-6 p-4 rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] flex items-center justify-between" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.06);">
          <div>
            <div class="text-sm font-extrabold">Get FreshDrop</div>
            <div class="mt-1 text-xs text-[var(--muted)]">Order faster with saved addresses and one-tap reorders.</div>
          </div>
          <div class="flex items-center gap-2">
            <a href="#" class="h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] inline-flex items-center gap-2 text-xs font-semibold">
              <i class="fa-brands fa-apple text-[var(--muted)]"></i>
              <span>App Store</span>
            </a>
            <a href="#" class="h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] inline-flex items-center gap-2 text-xs font-semibold">
              <i class="fa-brands fa-google-play text-[var(--muted)]"></i>
              <span>Google Play</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>
</main>

<footer class="px-10 pb-8">
  <div class="flex items-center justify-between p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]" style="box-shadow: 0 12px 28px rgba(2, 6, 23, 0.08); backdrop-filter: blur(10px);">
    <div class="text-xs text-[var(--muted)]">© 2026 FreshDrop. All rights reserved.</div>
    <div class="flex items-center gap-4 text-xs">
      <a href="#" class="text-[var(--muted)] hover:text-[var(--text)]">Terms</a>
      <a href="#" class="text-[var(--muted)] hover:text-[var(--text)]">Privacy</a>
      <a href="#" class="text-[var(--muted)] hover:text-[var(--text)]">Partner with us</a>
      <a href="#" class="text-[var(--muted)] hover:text-[var(--text)]">Careers</a>
    </div>
  </div>
</footer>
</body>
</html>`;
  }, []);

  /* --------------------------------------------------- */
  /* RUNTIME TOKEN INJECTION (THE REAL FIX)             */
  /* --------------------------------------------------- */

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const injectTheme = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const t = themes[activeTheme];
      const f = fonts[activeFont];

      const existing = doc.getElementById("dynamic-theme");
      if (existing) existing.remove();

      const existingFont = doc.getElementById("dynamic-font");
      if (existingFont) existingFont.remove();

      const style = doc.createElement("style");
      style.id = "dynamic-theme";
      style.innerHTML = `
        :root {
          --bg: ${t.bg};
          --card-bg: ${t.card};
          --text: ${t.text};
          --muted: ${t.muted};
          --primary: ${t.primarySolid};
          --primary-gradient: ${t.primary};
          --font: ${f.family};
        }
      `;

      const fontLink = doc.createElement("link");
      fontLink.id = "dynamic-font";
      fontLink.rel = "stylesheet";
      fontLink.href = f.url;

      doc.head.appendChild(fontLink);
      doc.head.appendChild(style);
    };

    iframe.addEventListener("load", injectTheme);
    injectTheme();

    return () => {
      iframe.removeEventListener("load", injectTheme);
    };
  }, [activeTheme, activeFont]);

  /* --------------------------------------------------- */
  /* UI CONTROLS                                         */
  /* --------------------------------------------------- */

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 300, padding: 20, background: "#f3f4f6" }}>
        <h3>Themes</h3>

        {Object.keys(themes).map((name) => (
          <button
            key={name}
            onClick={() => setActiveTheme(name)}
            style={{
              width: "100%",
              marginBottom: 8,
              padding: 8,
              borderRadius: 6,
              border: "none",
              background: activeTheme === name ? "#111827" : "#e5e7eb",
              color: activeTheme === name ? "white" : "black",
            }}
          >
            {name}
          </button>
        ))}

        <h3 style={{ marginTop: 20 }}>Fonts</h3>

        {Object.keys(fonts).map((name) => (
          <button
            key={name}
            onClick={() => setActiveFont(name)}
            style={{
              width: "100%",
              marginBottom: 8,
              padding: 8,
              borderRadius: 6,
              border: "none",
              background: activeFont === name ? "#16a34a" : "#e5e7eb",
              color: activeFont === name ? "white" : "black",
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={iframeHTML}
        style={{ flex: 1, border: "none" }}
      />
    </div>
  );
}
