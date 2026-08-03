from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import logging

from ..database import SessionLocal
from .. import models
from ..utils import (
    send_email,
    send_whatsapp,
    build_reminder_email,
    build_reminder_whatsapp,
)

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


def check_and_send_reminders():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        window_24h_start = now + timedelta(hours=23, minutes=50)
        window_24h_end = now + timedelta(hours=24, minutes=10)
        window_today_start = now - timedelta(minutes=10)
        window_today_end = now + timedelta(minutes=10)

        users = db.query(models.User).filter(
            (models.User.email_notifications == True) |
            (models.User.whatsapp_notifications == True)
        ).all()

        for user in users:
            tasks = db.query(models.Task).filter(
                models.Task.user_id == user.id,
                models.Task.status != models.StatusEnum.completed,
                models.Task.due_date.isnot(None),
            ).all()

            for task in tasks:
                due = task.due_date.replace(tzinfo=timezone.utc) if task.due_date.tzinfo is None else task.due_date
                due_str = due.strftime("%B %d, %Y at %I:%M %p UTC")

                # 24-hour reminder
                if window_24h_start <= due <= window_24h_end:
                    _send_notification(user, task, due_str, "in 24 hours")

                # Due-date reminder
                elif window_today_start <= due <= window_today_end:
                    _send_notification(user, task, due_str, "today")

    except Exception as exc:
        logger.error("Scheduler error: %s", exc)
    finally:
        db.close()


def _send_notification(user: models.User, task: models.Task, due_str: str, timing: str):
    if user.email_notifications and user.email:
        subject, body = build_reminder_email(task.title, due_str, user.name, timing)
        send_email(user.email, subject, body)

    if user.whatsapp_notifications and user.phone_number:
        message = build_reminder_whatsapp(task.title, due_str, user.name, timing)
        send_whatsapp(user.phone_number, message)


def start_scheduler():
    scheduler.add_job(
        check_and_send_reminders,
        trigger=IntervalTrigger(minutes=15),
        id="reminder_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — checking reminders every 15 minutes")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped")
