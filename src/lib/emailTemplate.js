/**
 * Shared beautiful HTML email template for Qada.Bet
 */

const BRAND_COLOR = '#1a237e'; // primary deep blue
const ACCENT_COLOR = '#f9a825'; // secondary gold/yellow

export function buildEmailHtml({ preheader = '', body = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Qada.Bet</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f4f6fb;font-size:1px;">${preheader}</div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <!-- Logo text (swap src with real logo URL when available) -->
              <div style="display:inline-block;">
                <span style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
                  Qada<span style="color:${ACCENT_COLOR};">.</span>Bet
                </span>
              </div>
              <div style="margin-top:6px;">
                <span style="background:${ACCENT_COLOR};color:${BRAND_COLOR};font-size:11px;font-weight:700;letter-spacing:2px;padding:3px 12px;border-radius:20px;text-transform:uppercase;">Social Impact · Predictions</span>
              </div>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              ${body}
            </td>
          </tr>

          <!-- ===== DISCLAIMER BAND ===== -->
          <tr>
            <td style="background:#f0f4ff;border:1px solid #e8eaf6;border-top:0;padding:16px 40px;">
              <p style="margin:0;font-size:12px;color:#5c6bc0;text-align:center;line-height:1.6;">
                ⚠️ <strong>Qada.Bet is NOT a gambling platform.</strong> Users do not win money.
                All activated pledges go directly to verified charitable causes.
                We convert predictions into measurable social change.
              </p>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">

              <!-- Brand -->
              <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#ffffff;">
                Qada<span style="color:${ACCENT_COLOR};">.</span>Bet
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.6);">Social Impact through Predictions</p>

              <!-- Socials -->
              <div style="margin-bottom:16px;">
                <a href="https://twitter.com/QadaBet" style="display:inline-block;margin:0 6px;background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 14px;color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;">𝕏 Twitter</a>
                <a href="https://instagram.com/QadaBet" style="display:inline-block;margin:0 6px;background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 14px;color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;">📷 Instagram</a>
                <a href="https://facebook.com/QadaBet" style="display:inline-block;margin:0 6px;background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 14px;color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;">📘 Facebook</a>
              </div>

              <!-- Contact -->
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);">
                📧 <a href="mailto:hello@qada.bet" style="color:${ACCENT_COLOR};text-decoration:none;">hello@qada.bet</a>
                &nbsp;|&nbsp;
                📞 <a href="tel:+2349099996424" style="color:${ACCENT_COLOR};text-decoration:none;">+234 909 999 6424</a>
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.55);">
                Asokoro, Abuja, Federal Capital Territory, Nigeria
              </p>

              <!-- Divider -->
              <hr style="border:0;border-top:1px solid rgba(255,255,255,0.15);margin:0 0 14px;" />

              <!-- Copyright -->
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">
                © ${new Date().getFullYear()} Qada.Bet. All rights reserved.<br/>
                You received this email because you interacted with Qada.Bet.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Helper: render a key-value detail row */
export function detailRow(label, value, highlight = false) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#666;width:45%;">${label}</td>
          <td style="font-size:13px;font-weight:${highlight ? '800' : '600'};color:${highlight ? '#1a237e' : '#1a1a2e'};text-align:right;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}