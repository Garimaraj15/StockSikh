import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
MAIL_FROM = os.getenv('MAIL_FROM', MAIL_USERNAME)
MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://localhost:3000')


def send_email_alert(recipient_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """
    Sends an email alert via configured SMTP server with TLS.
    Never exposes or logs SMTP passwords or credentials.
    Returns True if sent successfully, False otherwise.
    """
    if not recipient_email or not recipient_email.strip():
        print("Notification email skipped: user has no registered email.")
        return False

    clean_recipient = recipient_email.strip()

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print(f"SMTP skipped (credentials not configured in environment) for recipient: {clean_recipient[:3]}***")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[StockSikh AI] {subject}"
        msg['From'] = f"StockSikh AI <{MAIL_FROM}>"
        msg['To'] = clean_recipient

        # Plain-text alternative
        plain_text = text_body or subject
        part1 = MIMEText(plain_text, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')

        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=10) as server:
            server.starttls()
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, [clean_recipient], msg.as_string())

        masked = clean_recipient.split('@')[0][:3] + '***@' + (clean_recipient.split('@')[1] if '@' in clean_recipient else '')
        print(f"Email alert dispatched successfully to: {masked}")
        return True
    except Exception as e:
        print(f"Email dispatch error: {type(e).__name__} - {str(e)[:100]}")
        return False


def build_notification_html(title: str, message: str, notification_type: str, action_url: Optional[str] = None) -> str:
    """
    Builds a clean, responsive HTML email template for StockSikh notifications.
    """
    full_url = f"{APP_BASE_URL}{action_url}" if action_url and action_url.startswith('/') else (action_url or APP_BASE_URL)

    type_colors = {
        "DIRECT_MESSAGE": "#387ED1",
        "TRADE_BUY": "#00D09C",
        "TRADE_SELL": "#00D09C",
        "PRICE_ALERT": "#EF4444",
        "REWARD": "#F59E0B"
    }
    badge_color = type_colors.get(notification_type, "#00D09C")
    badge_label = notification_type.replace("_", " ").title()

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);overflow:hidden;" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #F1F5F9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">
                      Stock<span style="color:#00D09C;">Sikh</span> <span style="font-size:10px;background-color:#0F172A;color:#FFFFFF;padding:2px 6px;border-radius:4px;font-weight:800;vertical-align:middle;">AI</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:{badge_color};background-color:#F8FAFC;padding:4px 10px;border-radius:12px;border:1px solid #E2E8F0;">
                      {badge_label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#0F172A;line-height:1.4;">
                {title}
              </h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                {message}
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
                <tr>
                  <td style="border-radius:14px;background-color:#0F172A;">
                    <a href="{full_url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:14px;">
                      Open StockSikh &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #F1F5F9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.5;">
                This is an automated notification from your StockSikh AI paper trading account.<br>
                Educational Simulator &bull; Not personalized financial advice.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_notification_email(
    recipient_email: str,
    subject: str,
    title: str,
    message: str,
    notification_type: str = "NOTIFICATION",
    action_url: Optional[str] = None
) -> bool:
    """
    Constructs and sends a notification email to the verified user email.
    """
    html_content = build_notification_html(
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=action_url
    )
    plain_text = f"StockSikh Notification: {title}\n\n{message}\n\nOpen StockSikh: {APP_BASE_URL}{action_url or ''}"
    return send_email_alert(recipient_email, subject, html_content, plain_text)


def get_trade_email_template(username: str, symbol: str, trade_type: str, quantity: int, price: float, total_amount: float) -> str:
    """
    Legacy helper for test-email endpoint.
    """
    return build_notification_html(
        title=f"Paper {trade_type} Executed: {symbol}",
        message=f"{username} executed {quantity} shares of {symbol} at Rs. {price:,.2f} (Total: Rs. {total_amount:,.2f}).",
        notification_type=f"TRADE_{trade_type}",
        action_url="/portfolio"
    )