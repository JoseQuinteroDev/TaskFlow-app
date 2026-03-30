import logging

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_email(to: str, subject: str, content: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email")
        return False

    try:
        message = Mail(
            from_email=settings.SENDER_EMAIL,
            to_emails=to,
            subject=subject,
            html_content=content,
        )
        response = SendGridAPIClient(settings.SENDGRID_API_KEY).send(message)
        logger.info("Email sent to %s, status=%s", to, response.status_code)
        return response.status_code == 202
    except Exception as exc:  # SendGrid client raises library-specific errors
        logger.error("Failed to send email: %s", exc)
        return False


def send_task_reminder(user_email: str, user_name: str, task_title: str, due_date: str) -> bool:
    subject = f"Task reminder: {task_title}"
    content = f"""
    <html>
      <body style=\"font-family: Inter, sans-serif;\">
        <h2>Hello {user_name},</h2>
        <p>This is a reminder for your task:</p>
        <div>
          <strong>{task_title}</strong><br />
          Due date: {due_date}
        </div>
        <p>- TaskFlow</p>
      </body>
    </html>
    """
    return send_email(user_email, subject, content)
