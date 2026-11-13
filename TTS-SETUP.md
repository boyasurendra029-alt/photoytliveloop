# Natural Telugu voice (2 minutes, optional but recommended)

The browser's built-in voice sounds robotic and depends on the device. For a natural Telugu voice, add ONE speech key
to Vercel. The key stays on the server (never visible to viewers).

## Option A — Azure Speech (recommended)
Voices: te-IN-ShrutiNeural (female), te-IN-MohanNeural (male) + Hindi / Tamil / English-India.
1. portal.azure.com → create a **Speech** resource (choose the Free **F0** pricing tier if offered; it has a monthly free allowance — check the current limit).
2. Open the resource → **Keys and Endpoint** → copy **KEY 1** and the **Region** (e.g. `centralindia`).
3. Vercel → your project → **Settings → Environment Variables** → add
   - `AZURE_SPEECH_KEY` = your key
   - `AZURE_SPEECH_REGION` = your region
4. **Deployments → Redeploy**.

## Option B — Google Cloud Text-to-Speech
1. console.cloud.google.com → enable **Cloud Text-to-Speech API** → Credentials → create an **API key**.
2. Vercel → Environment Variables → `GOOGLE_TTS_KEY` = that key → Redeploy.

## Check
Open `/studio.html` → in **3 · Voice** the list now starts with **★ … — Neural (best)**. Press **Test voice**.
If the neural voice ever fails (quota, network) the page automatically falls back to the device voice.

Tip: the sentences the host repeats (welcome, questions, lines) are cached in the browser, so they cost speech quota only the first time.
