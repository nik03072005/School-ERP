// Session (free-text) messages — only works inside 24-hr customer-initiated window
const GABS_SESSION_URL = "https://app.getgabs.com/sendservicemessages/sendmessages";

// Template messages — works any time, requires pre-approved template
const GABS_TEMPLATE_URL = "https://app.getgabs.com/whatsappbusiness/send-templated-message";

const schoolName = () => process.env.SCHOOL_NAME || "School";
const defaultCountryCode = () => process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

const normalizePhone = (rawPhone) => {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `${defaultCountryCode()}${digits}`;
  return digits;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ── Low-level: send a pre-approved template ────────────────────────────────
// receiverName   : recipient's display name (required by Gabs)
// bodyParams     : strings that fill {{1}}, {{2}}, … in the template body
// headerParams   : optional strings for header component
export const sendWhatsAppTemplate = async (rawPhone, templateName, bodyParams = [], { receiverName = "Parent", headerParams = [], campaignId } = {}) => {
  const apiKey = process.env.GABS_API_KEY;
  const sender = process.env.GABS_SENDER;
  const resolvedCampaignId = campaignId || process.env.GABS_CAMPAIGN_ID;

  if (!apiKey || !sender || !resolvedCampaignId) {
    console.warn("[whatsapp] GABS_API_KEY / GABS_SENDER / campaign_id not set, skipping send");
    return null;
  }

  const to = normalizePhone(rawPhone);
  if (!to) return null;

  const components = [];

  if (headerParams.length > 0) {
    components.push({
      type: "HEADER",
      parameters: headerParams.map((text) => ({ type: "text", text: String(text) })),
    });
  }

  if (bodyParams.length > 0) {
    components.push({
      type: "BODY",
      parameters: bodyParams.map((text) => ({ type: "text", text: String(text) })),
    });
  }

  const payload = {
    api_key: apiKey,
    sender,
    campaign_id: resolvedCampaignId,
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    receiver_name: receiverName,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" },
      ...(components.length > 0 && { components }),
    },
  };

  try {
    const response = await fetch(GABS_TEMPLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("[whatsapp] template send failed", response.status, data);
      return null;
    }
    console.log("[whatsapp] template sent:", templateName, "→", to);
    return data;
  } catch (error) {
    console.error("[whatsapp] template send error", error.message);
    return null;
  }
};

// ── Low-level: send a free-text message (only works inside 24-hr window) ──
export const sendWhatsAppMessage = async (rawPhone, body) => {
  const apiKey = process.env.GABS_API_KEY;
  if (!apiKey) {
    console.warn("[whatsapp] GABS_API_KEY not set, skipping send");
    return null;
  }

  const to = normalizePhone(rawPhone);
  if (!to) return null;

  try {
    const response = await fetch(GABS_SESSION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        text: { body, preview_url: false },
        type: "text",
        recipient_type: "individual",
        messaging_product: "whatsapp",
        api_key: apiKey,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("[whatsapp] send failed", response.status, data);
      return null;
    }
    return data;
  } catch (error) {
    console.error("[whatsapp] send error", error.message);
    return null;
  }
};

// ── Attendance notification ────────────────────────────────────────────────
// Template: "attendance"
// Body params: {{1}}=studentName  {{2}}=class  {{3}}=PRESENT/ABSENT/LATE  {{4}}=date
const ATTENDANCE_TEXT_TEMPLATES = {
  present: ({ studentName, className, date }) =>
    `Dear Parent, your child ${studentName} of Class ${className} is PRESENT today (${date}).\n– ${schoolName()}`,
  absent: ({ studentName, className, date }) =>
    `Dear Parent, your child ${studentName} of Class ${className} is ABSENT today (${date}).\nPlease ensure regular attendance. – ${schoolName()}`,
  late: ({ studentName, className, date }) =>
    `Dear Parent, your child ${studentName} of Class ${className} arrived LATE to school today (${date}).\n– ${schoolName()}`,
};

export const sendAttendanceWhatsApp = async ({ phone, studentName, className, status, date, receiverName }) => {
  if (!phone || !studentName) return null;

  const formattedDate = formatDate(date);
  const statusLabel = (status || "").toUpperCase();

  const templateName =
    process.env[`GABS_ATTENDANCE_TEMPLATE_${statusLabel}`] ||
    process.env.GABS_ATTENDANCE_TEMPLATE;

  if (templateName) {
    return sendWhatsAppTemplate(
      phone,
      templateName,
      [studentName, className || "", statusLabel, formattedDate],
      { receiverName: receiverName || "Parent", campaignId: process.env.GABS_ATTENDANCE_CAMPAIGN_ID }
    );
  }

  const textTemplate = ATTENDANCE_TEXT_TEMPLATES[status];
  if (!textTemplate) return null;
  return sendWhatsAppMessage(phone, textTemplate({ studentName, className, date: formattedDate }));
};

// ── Fee notice notification ────────────────────────────────────────────────
// Template: "fee_reminder"
// Body params: {{1}}=schoolName  {{2}}=studentName  {{3}}=feeType  {{4}}=amount  {{5}}=dueDate
export const sendFeeWhatsApp = async ({ phone, studentName, feeType, amount, dueDate, receiverName }) => {
  if (!phone || !studentName) return null;

  const formattedDue = dueDate ? formatDate(dueDate) : "as soon as possible";
  const templateName = process.env.GABS_FEE_TEMPLATE;

  if (templateName) {
    return sendWhatsAppTemplate(
      phone,
      templateName,
      [schoolName(), studentName, feeType || "School Fee", String(amount || ""), formattedDue],
      { receiverName: receiverName || "Parent", campaignId: process.env.GABS_FEE_CAMPAIGN_ID }
    );
  }

  const body =
    `Dear Parent, this is a fee reminder from ${schoolName()}.\n\n` +
    `Student: ${studentName}\nFee Type: ${feeType || "School Fee"}\nAmount Due: ₹${amount}\nDue Date: ${formattedDue}\n\n` +
    `Please ensure timely payment. Contact the school accounts office for queries.`;
  return sendWhatsAppMessage(phone, body);
};

// ── Notice notification ────────────────────────────────────────────────────
// Template: "notice"
// Body params: {{1}}=schoolName  {{2}}=noticeTitle  {{3}}=noticeContent (truncated 200 chars)
export const sendNoticeWhatsApp = async ({ phone, title, content, receiverName }) => {
  if (!phone) return null;

  const templateName = process.env.GABS_NOTICE_TEMPLATE;

  if (templateName) {
    return sendWhatsAppTemplate(
      phone,
      templateName,
      [schoolName(), title || "", String(content || "").slice(0, 200)],
      { receiverName: receiverName || "Parent", campaignId: process.env.GABS_NOTICE_CAMPAIGN_ID }
    );
  }

  const body = `Dear Parent/Staff, a new notice has been published by ${schoolName()}:\n\n*${title}*\n${String(content).slice(0, 300)}`;
  return sendWhatsAppMessage(phone, body);
};
