# YouTube Bot Detection & Cloud Hosting Guide

## Why does "Sign in to confirm you're not a bot" happen?
When you host your backend on cloud providers (such as Hugging Face Spaces, Render, Railway, AWS, DigitalOcean, etc.), YouTube recognizes that the incoming requests originate from a **datacenter IP address**. To prevent mass automated downloading, YouTube displays a bot verification challenge (`HTTP 429` / `Sign in to confirm you're not a bot`).

---

## 1. Automatic Fix Applied (Zero Configuration Needed)
We have updated `server/main.py` with:
- **InnerTube Player Clients**: Configured `['android', 'visionos', 'ios', 'mweb', 'web']`. Mobile and VisionOS clients bypass YouTube's standard web bot-detection mechanism.
- **Node.js JS Runtime**: Added to `Dockerfile` so `yt-dlp` can execute YouTube signature solving scripts automatically.
- **Anti-Bot Headers**: Added realistic browser user-agent and language headers.

In most cases, pushing these updates will immediately resolve the bot errors!

---

## 2. If Your Cloud Provider's IP is Hard-Blocked (The Permanent 100% Solution)
If YouTube aggressively blocks your specific cloud server's IP range, providing your YouTube cookies ensures uninterrupted access.

### Step-by-Step: Export Cookies in 30 Seconds
1. In Chrome, Edge, or Brave on your PC:
   - Install the extension: **[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)** (open-source, does not upload your data).
2. Go to **[youtube.com](https://www.youtube.com/watch?v=dQw4w9WgXcQ)** and make sure you are signed in (you can use an alternate/throwaway Google account if you prefer).
3. Click the **Get cookies.txt LOCALLY** extension icon in your browser toolbar.
4. Click **Export** or copy the entire text.

### How to use the cookies:

#### Option A: Hugging Face Spaces / Render (Recommended - No file upload)
1. Go to your Hugging Face Space or Render dashboard.
2. Go to **Settings** -> **Variables and secrets** (or **Environment Variables**).
3. Create a new Secret or Environment Variable:
   - **Name**: `YOUTUBE_COOKIES`
   - **Value**: Paste the exported cookies text here.
4. Restart your Space / service. The server automatically detects and uses it.

#### Option B: Local / Self-Hosted
- Save the exported cookies as `cookies.txt` inside the `server/` directory:
  `server/cookies.txt` (This file is already included in `.gitignore` to prevent committing it to GitHub).
