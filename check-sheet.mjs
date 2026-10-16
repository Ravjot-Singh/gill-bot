// Places one small test enquiry through the live Gill bot and reports whether
// it reached the owner's Google Sheet: "sent", "failed" or "demo" (no sheet set).
// Uses at most 4 AI requests, 10 seconds apart. No extra packages: needs Node 18+.
// Run from the starter folder:  node my-bot/check-sheet.mjs
const ENDPOINT = "https://lucky-king-524c.ravjot851.workers.dev/chat";
const WAIT_MS = 10000;
const MAX_TURNS = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const messages = [];
let next = "Please send an enquiry to your team: I need 2 bobbin cases for my domestic sewing machine. I am a tailor in Ludhiana. My name is Sheet Test and my WhatsApp is +91 98765 43210.";

for (let turn = 1; turn <= MAX_TURNS && next; turn++) {
  await sleep(WAIT_MS);
  messages.push({ role: "user", content: next });
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, meta: { sessionId: "gill-sheet-check", enquiriesSent: [] } }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`\nYou: ${next}\nBot (HTTP ${res.status}): ${data.reply || data.error || ""}`);
  if (!res.ok) { console.log("\nThe bot did not answer; try again in a minute."); break; }
  messages.push({ role: "assistant", content: data.reply });

  if (data.enquiry) {
    console.log(`\nOrder ${data.enquiry.ref}: delivery status "${data.enquiry.status}"`);
    console.log({
      sent: "It reached the Google Sheet (or Telegram). Look for the row named Sheet Test in the Gill Enquiries tab.",
      failed: "The sheet refused it or did not answer. Check LEAD_WEBHOOK_URL and ?key= in Cloudflare.",
      demo: "No sheet is connected: LEAD_WEBHOOK_URL is not set on this worker.",
    }[data.enquiry.status] || "");
    break;
  }
  next = /shall i send|send this to/i.test(data.reply)
    ? "Yes, please send it."
    : "That's everything. Please send it to the team.";
}
