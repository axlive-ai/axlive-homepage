// Netlify reserved function name: automatically invoked after every
// successful Netlify Forms submission on this site.
// Sends a custom-designed notification email via the Netlify Email
// Integration (emails/form-submission/index.html template).

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const data = (body.payload && body.payload.data) || {};

    const parameters = {
      name: data["이름"] || "",
      company: data["회사명"] || "",
      title: data["직책"] || "",
      email: data["email"] || "",
      phone: data["연락처"] || "",
      interest: data["관심분야"] || "",
      timeline: data["예상일정"] || "",
      message: data["문의내용"] || "",
    };

    const res = await fetch(
      `${process.env.URL}/.netlify/functions/emails/form-submission`,
      {
        method: "POST",
        headers: {
          "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: "septemai@septem-ai.com",
          to: "septemai@septem-ai.com",
          subject: "AXlive 서비스 문의",
          parameters,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to send styled notification email:", res.status, text);
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("submission-created error:", err);
    // Never fail the form submission itself because of an email error.
    return { statusCode: 200, body: "ok" };
  }
};
