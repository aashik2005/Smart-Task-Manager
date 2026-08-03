import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


def send_email(to_email: str, subject: str, body: str) -> bool:
    if not GMAIL_USER or not GMAIL_PASSWORD:
        logger.warning("Email credentials not configured — skipping email send")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = GMAIL_USER
        msg["To"] = to_email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        logger.info("Email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_whatsapp(to_number: str, message: str) -> bool:
    if not TWILIO_SID or not TWILIO_TOKEN:
        logger.warning("Twilio credentials not configured — skipping WhatsApp send")
        return False
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        to_whatsapp = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
        client.messages.create(body=message, from_=TWILIO_WHATSAPP_FROM, to=to_whatsapp)
        logger.info("WhatsApp sent to %s", to_number)
        return True
    except Exception as exc:
        logger.error("Failed to send WhatsApp to %s: %s", to_number, exc)
        return False


def build_reminder_email(task_title: str, due_date: str, user_name: str, timing: str) -> tuple[str, str]:
    subject = f"Task Reminder: {task_title} is due {timing}"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:#4F46E5;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="color:white;margin:0;">Task Reminder</h2>
      </div>
      <div style="border:1px solid #e5e7eb;padding:24px;border-radius:0 0 8px 8px;">
        <p>Hi <strong>{user_name}</strong>,</p>
        <p>This is a reminder that your task <strong>"{task_title}"</strong> is due <strong>{timing}</strong>.</p>
        <p><strong>Due Date:</strong> {due_date}</p>
        <p>Log in to Smart Task Manager to view or update your task.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:12px;">Smart Task Manager — Stay on top of your work.</p>
      </div>
    </body></html>
    """
    return subject, body


def build_reminder_whatsapp(task_title: str, due_date: str, user_name: str, timing: str) -> str:
    return (
        f"Hi {user_name}! 👋\n\n"
        f"⏰ *Task Reminder*\n\n"
        f"Your task *\"{task_title}\"* is due *{timing}*.\n"
        f"📅 Due Date: {due_date}\n\n"
        f"Log in to Smart Task Manager to check your progress!"
    )
