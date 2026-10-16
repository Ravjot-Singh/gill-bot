# Gill Sewing Machine Parts chatbot

A website chatbot for **Gill Sewing Machine Parts**, a fictional spare parts and repair shop near Clock Tower, Ludhiana (made for a classroom exercise; all contact details are placeholders). Built from the Session 10 starter kit, using the kit's `cards/gill-sewing-parts.md` business card and `tests/gill-sewing-parts.md` test sheet.

The bot answers questions about parts, repairs, hours, location and shipping, helps customers work out the part they need (machine type, brand, model), and passes confirmed enquiries to the owner's Google Sheet. It never quotes prices or repair costs, never promises stock or fit, and never gives electrical repair steps.

## What's in this repo

| File | What it is |
|---|---|
| `worker.js` | The bot backend (Cloudflare Worker). Copy of the kit's `worker.js` with only Section 2 (facts) and Section 3 (rules) changed. |
| `site/index.html` | The one-page website, with the chat widget built into the same file. Upload just this file. |
| `site/chat-widget.js` | The kit's chat widget as a separate file. Not needed any more: the same code is inside `index.html`. |
| `google-sheet-webhook.gs` | Apps Script that writes confirmed enquiries to a Google Sheet: Gill's go to the **Gill Enquiries** tab, Sandhu Bakers' to **Enquiries**. |
| `run-tests.mjs` | Sends the 15 tests to the live bot; saves `test-raw.json`. |
| `test-results.md` | The latest results table. |
| `check-sheet.mjs` | Places one test enquiry to check the Google Sheet connection. |

## Live addresses
- Worker (bot): `https://lucky-king-524c.ravjot851.workers.dev/chat`
- Website: uploaded separately to Cloudflare Pages (just `site/index.html`).

## Deploy the bot
1. Cloudflare > Workers & Pages > the worker `lucky-king-524c` > **Edit code**. Select all, paste `worker.js`, **Deploy**.
2. Settings > **Variables and Secrets**:
   - `LLM_BASE_URL`: `https://api.groq.com/openai/v1`
   - `LLM_MODEL`: `openai/gpt-oss-120b`
   - `LLM_API_KEY`: your key, type **Secret** (only ever typed here, never in a file or chat)
   - `ALLOWED_ORIGINS`: the website's exact address, e.g. `https://gill-parts.pages.dev` (`*` only while testing)
   - `LEAD_WEBHOOK_URL`: the Apps Script web app URL ending in `/exec?key=YOUR_SECRET`, type **Secret**

## Deploy the website
Cloudflare > Workers & Pages > Create > Pages > **Upload assets**, and upload `site/index.html`. The chat endpoint in it is already set to the worker above.

## Google Sheet
1. In the sheet: Extensions > Apps Script. Paste `google-sheet-webhook.gs`. Set `SECRET` and (optionally) `NOTIFY_EMAIL`.
2. First time: Deploy > New deployment > Web app; Execute as **Me**, access **Anyone**. Copy the `/exec` URL.
   After any change: Deploy > Manage deployments > pencil > Version: **New version** > Deploy (keeps the same URL).
3. Put the URL plus `?key=YOUR_SECRET` in the worker's `LEAD_WEBHOOK_URL`. The Sandhu Bakers bot can use the same URL; each business gets its own tab.

## Test
Run from inside this folder (needs Node.js 18+, no packages). The bot uses a free AI plan, so keep runs small.

```bash
node run-tests.mjs
```

```bash
node check-sheet.mjs
```

- `run-tests.mjs` uses about 20 AI requests and sends one test enquiry ("Gurpreet Singh") to the sheet. Before running it, check that `ENDPOINT` at the top is the Gill worker above.
- `check-sheet.mjs` uses 2 to 4 requests and sends one enquiry ("Sheet Test").
- Delete those test rows afterwards. Judge the replies against `tests/gill-sewing-parts.md` in the starter kit and update `test-results.md`.

## Status
- Latest recorded score: **12 / 15** (failed tests 4, 9 and 15). Fixes for those three are in `worker.js` but haven't been retested yet.
- Known issue: the bot can send an enquiry when the customer says "send it" without first showing the summary and asking "Shall I send this to our team?".
