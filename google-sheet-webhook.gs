/**
 * ENQUIRY INBOX FOR TWO BOTS: one Google Sheet, one tab per business.
 * Based on extras/google-sheet-webhook.gs. The only change: each enquiry goes
 * to the tab for its business (the bot sends its BUSINESS_NAME as "business").
 *   Sandhu Bakers              -> tab "Enquiries"        (the existing tab)
 *   Gill Sewing Machine Parts  -> tab "Gill Enquiries"   (created on the first Gill enquiry)
 *
 * Setup:
 *  1. In your existing sheet: Extensions > Apps Script. Replace the code with this file.
 *  2. Put YOUR secret word in SECRET (the same one the workers use after ?key=)
 *     and your email in NOTIFY_EMAIL if wanted.
 *  3. Deploy > Manage deployments > (pencil icon) > Version: New version > Deploy.
 *     This keeps the same web app URL, so the bakery worker needs no change.
 *  4. Give the Gill worker the SAME LEAD_WEBHOOK_URL as the bakery worker
 *     (the web app URL ending in /exec, plus ?key=YOUR_SECRET).
 *
 * IMPORTANT: after ANY change to this code, go to Deploy > Manage deployments >
 * (pencil icon) > Version: New version > Deploy. Otherwise the old code keeps running.
 */
const SECRET = "change-me-to-a-long-random-word";
const NOTIFY_EMAIL = "";          // e.g. "owner@example.com"; leave "" for no email

// Which tab each business's enquiries go to. A business not listed here gets a
// tab named after itself; an enquiry with no business goes to DEFAULT_SHEET.
const SHEET_FOR_BUSINESS = {
  "Sandhu Bakers": "Enquiries",
  "Gill Sewing Machine Parts": "Gill Enquiries",
};
const DEFAULT_SHEET = "Enquiries";

const COLUMNS = [
  "ref", "received_at", "priority", "is_update", "customer_name", "company",
  "country", "city", "phone_whatsapp", "email", "preferred_contact",
  "buyer_type", "enquiry_type", "items", "delivery_destination", "timeline",
  "summary", "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "page", "session_id", "status"
];

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET) return reply({ ok: false, error: "unauthorised" });

  let lead;
  try { lead = JSON.parse(e.postData.contents); }
  catch (err) { return reply({ ok: false, error: "body is not valid JSON" }); }

  const sheetName = sheetNameFor(lead.business);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
  }

  const itemsText = (lead.items || [])
    .map(i => [i.product, i.specification, i.quantity && "qty " + i.quantity].filter(Boolean).join(", "))
    .join("\n");

  const row = COLUMNS.map(c => {
    if (c === "items") return asText(itemsText);
    if (c === "status") return "New";   // the team changes this: Contacted, Quoted, Won, Lost
    const v = lead[c];
    return v === undefined || v === null ? "" : asText(v);
  });
  sheet.appendRow(row);

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `[${lead.business || "Website"}] ${lead.is_update ? "Updated" : "New"} enquiry ${lead.ref} [${lead.priority}] ${lead.customer_name}, ${lead.country}`,
      body: [
        lead.summary, "",
        `Name: ${lead.customer_name}${lead.company ? " (" + lead.company + ")" : ""}`,
        `Location: ${[lead.city, lead.country].filter(Boolean).join(", ")}`,
        `WhatsApp/phone: ${lead.phone_whatsapp || "-"}`,
        `Email: ${lead.email || "-"}`,
        `Type: ${lead.buyer_type}, ${lead.enquiry_type}`, "",
        "Items:", itemsText, "",
        `Destination: ${lead.delivery_destination || "-"}`,
        `Timeline: ${lead.timeline || "-"}`,
        `Came from: ${[lead.utm_source, lead.utm_campaign].filter(Boolean).join(" / ") || "website"}`
      ].join("\n")
    });
  }
  return reply({ ok: true, ref: lead.ref, sheet: sheetName });
}

// Tab name for a business. Sheets tab names can't contain some characters and
// are limited to 100 characters, so anything unexpected is cleaned up.
function sheetNameFor(business) {
  const name = typeof business === "string" ? business.trim() : "";
  if (!name) return DEFAULT_SHEET;
  if (SHEET_FOR_BUSINESS[name]) return SHEET_FOR_BUSINESS[name];
  return name.replace(/[\[\]\*\?\/\\:']/g, " ").slice(0, 100).trim() || DEFAULT_SHEET;
}

// Google Sheets treats text starting with = + - or @ as a formula. That turns
// phone numbers like "+234 800..." into #ERROR!, and would let a visitor put a
// formula into your sheet. A leading apostrophe makes Sheets keep it as plain text.
function asText(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
