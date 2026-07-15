// Netlify reserved function name: automatically invoked after every
// successful Netlify Forms submission on this site.
// Sends a custom-designed notification email by calling the Postmark
// API directly (bypasses Netlify's built-in Email Integration system
// function, which currently fails with a Node ESM directory-import
// error on this account).

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function renderEmailHtml(p) {
  return `<html>
  <body style="margin:0; padding:0; background:#0A0B0D; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;">
    <table width="620" cellpadding="0" cellspacing="0" style="background:#0A0B0D; padding:32px 0;border-radius:12px">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#121417; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <div style="font-size:12px; letter-spacing:0.15em; color:#3FCF8E; font-weight:700;">CONTACT</div>
                <h1 style="margin:8px 0 4px 0; font-size:20px; color:#F1F2F4;">새로운 문의가 도착했습니다</h1>
                <p style="margin:0 0 20px 0; font-size:13px; color:#9598A2;">axlive.ai.kr 문의 폼을 통해 접수되었습니다.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:13px; color:#9598A2; width:100px;">이름</td><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:14px; color:#F1F2F4;">${escapeHtml(p.name)}</td></tr>
                  <tr><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:13px; color:#9598A2;">회사 / 소속</td><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:14px; color:#F1F2F4;">${escapeHtml(p.company)}</td></tr>
                  <tr><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:13px; color:#9598A2;">이메일</td><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:14px; color:#F1F2F4;">${escapeHtml(p.email)}</td></tr>
                  <tr><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:13px; color:#9598A2;">연락처</td><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:14px; color:#F1F2F4;">${escapeHtml(p.phone)}</td></tr>
                  <tr><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:13px; color:#9598A2;">문의 유형</td><td style="padding:10px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:14px; color:#F1F2F4;">${escapeHtml(p.interest)}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px 32px;">
                <div style="font-size:13px; color:#9598A2; margin-bottom:6px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08);">문의 내용</div>
                <div style="font-size:14px; color:#F1F2F4; line-height:1.6; background:#0A0B0D; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px;">${escapeHtml(p.message)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px; background:#0A0B0D; border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0; font-size:12px; color:#5D606A;">이 메일은 axlive.ai.kr 문의 폼 제출에 대한 자동 알림입니다.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const data = (body.payload && body.payload.data) || {};

    const parameters = {
      name: data["이름"] || "",
      company: data["회사명"] || "",
      email: data["email"] || "",
      phone: data["연락처"] || "",
      interest: data["관심분야"] || "",
      message: data["문의내용"] || "",
    };

    const token = process.env.NETLIFY_EMAILS_PROVIDER_API_KEY;

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: "AXLIVE <septemai@septem-ai.com>",
        To: "septemai@septem-ai.com, sajang@septem-ai.com",
        ReplyTo: parameters.email || undefined,
        Subject: "AXlive 서비스 문의",
        HtmlBody: renderEmailHtml(parameters),
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Postmark send failed:", res.status, text);
    } else {
      console.log("Postmark send ok");
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("submission-created error:", err);
    // Never fail the form submission itself because of an email error.
    return { statusCode: 200, body: "ok" };
  }
};
