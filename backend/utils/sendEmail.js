const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject line
 * @param {string} options.html     - HTML body
 * @param {string} [options.text]   - Plain-text fallback
 * @returns {Promise<object>}       - Resend API response
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] Skipped — RESEND_API_KEY not configured. Would have sent to: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
      text: text || subject,
    });

    if (error) {
      console.error('[Email] Resend Error:', error);
      return { error };
    }

    console.log(`[Email] Sent → ${to} | ID: ${data?.id}`);
    return data;
  } catch (err) {
    console.error('[Email] Exception caught during send:', err);
    return { error: err };
  }
};

/**
 * Pre-built template: Status Update Notification
 * Sent to a feature request author when an admin changes the post status.
 *
 * @param {object} params
 * @param {string} params.authorName  - Recipient's name
 * @param {string} params.authorEmail - Recipient's email
 * @param {string} params.postTitle   - Feature request title
 * @param {string} params.postDescription - Feature request description
 * @param {string} params.newStatus   - New status string
 * @param {string} params.postId      - MongoDB post _id (for deep link)
 * @param {string} params.rejectionReason - Reason if rejected
 */
const sendStatusUpdateEmail = async ({ authorName, authorEmail, postTitle, postDescription, newStatus, postId, rejectionReason }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const STATUS_COLORS = {
    'Under Review': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'Planned':      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'In Progress':  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
    'Completed':    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  };

  const colors = STATUS_COLORS[newStatus] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

  const STATUS_EMOJIS = {
    'Under Review': '🔍',
    'Planned':      '📋',
    'In Progress':  '⚡',
    'Completed':    '✅',
    'Rejected':     '❌',
  };

  const emoji = STATUS_EMOJIS[newStatus] || '📬';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feature Request Update</title>
</head>
<body style="margin:0;padding:0;background:#0e0f1d;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0f1d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#1e2035;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2840f5,#7c3aed);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:8px;">
                      <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-block;text-align:center;line-height:32px;font-size:16px;">⚡</div>
                      <span style="color:white;font-size:18px;font-weight:700;letter-spacing:-0.5px;margin-left:8px;">Roadmap Portal</span>
                    </div>
                    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0;">Feature Request Update</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 6px;">Hi ${authorName},</p>
              <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 20px;line-height:1.3;">
                Your feature request has been updated ${emoji}
              </h2>

              <!-- Post title card -->
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Feature Request</p>
                <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 8px;">${postTitle}</p>
                ${postDescription ? `<p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.5;margin:0;">${postDescription}</p>` : ''}
              </div>

              <!-- Status badge -->
              <div style="margin-bottom:28px;">
                <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">New Status</p>
                <span style="display:inline-block;background:${colors.bg};color:${colors.text};border:1px solid ${colors.border};border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;">
                  ${emoji} ${newStatus}
                </span>
              </div>

              ${rejectionReason ? `
              <!-- Rejection Reason -->
              <div style="background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;padding:16px;margin-bottom:28px;border-radius:4px;">
                <p style="color:#fca5a5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Admin Note</p>
                <p style="color:#fee2e2;font-size:14px;margin:0;line-height:1.6;">${rejectionReason}</p>
              </div>
              ` : ''}

              <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.7;margin:0 0 28px;">
                Our team has reviewed your submission and moved it to <strong style="color:rgba(255,255,255,0.85);">${newStatus}</strong>. 
                You can view your request and join the discussion on the portal.
              </p>

              <!-- CTA Button -->
              <a href="${appUrl}/feed"
                 style="display:inline-block;background:linear-gradient(135deg,#2840f5,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                View on Roadmap Portal →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;line-height:1.6;">
                You're receiving this because you submitted a feature request on Roadmap Portal.<br/>
                © ${new Date().getFullYear()} Roadmap Portal. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: authorEmail,
    subject: `${emoji} Your feature request is now "${newStatus}" — Roadmap Portal`,
    html,
    text: `Hi ${authorName},\n\nYour feature request "${postTitle}" has been updated to: ${newStatus}.\n\nDescription: ${postDescription || ''}\n\nView it here: ${appUrl}/feed\n\nThanks,\nRoadmap Portal Team`,
  });
};

module.exports = { sendEmail, sendStatusUpdateEmail };
