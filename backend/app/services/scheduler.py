from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import logging

from ..database import SessionLocal
from .. import models
from ..utils import (
    send_email, send_whatsapp,
    build_reminder_email, build_reminder_whatsapp,
)

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone="UTC")

WINDOW_MINUTES = 2.5  # fire if within ±2.5 min of trigger time


def check_and_send_reminders():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        users = db.query(models.User).filter(
            (models.User.email_notifications == True) |
            (models.User.whatsapp_notifications == True)
        ).all()

        for user in users:
            tasks = db.query(models.Task).filter(
                models.Task.user_id == user.id,
                models.Task.is_active == True,
                models.Task.status != models.StatusEnum.completed,
            ).all()

            for task in tasks:
                _process_task_reminder(db, user, task, now)

    except Exception as exc:
        logger.error("Scheduler error: %s", exc)
    finally:
        db.close()


def _process_task_reminder(db: Session, user: models.User, task: models.Task, now: datetime):
    try:
        if task.task_type in (models.TaskTypeEnum.one_time, models.TaskTypeEnum.target):
            _handle_offset_reminder(user, task, now)

        elif task.task_type == models.TaskTypeEnum.daily:
            if task.reminder_time:
                _handle_recurring_reminder(db, user, task, now)

        elif task.task_type == models.TaskTypeEnum.weekly:
            if task.reminder_time and task.recurrence_days:
                today_name = now.strftime("%A").lower()
                if today_name in (task.recurrence_days or []):
                    _handle_recurring_reminder(db, user, task, now)
    except Exception as exc:
        logger.error("Error processing reminder for task %s: %s", task.id, exc)


def _handle_offset_reminder(user: models.User, task: models.Task, now: datetime):
    if not task.due_date:
        return

    due = task.due_date.replace(tzinfo=timezone.utc) if task.due_date.tzinfo is None else task.due_date
    offset = task.reminder_offset_minutes if task.reminder_offset_minutes is not None else 0
    trigger_time = due - timedelta(minutes=offset)

    diff = abs((now - trigger_time).total_seconds() / 60)
    if diff <= WINDOW_MINUTES:
        timing = _describe_timing(offset, due, now)
        due_str = due.strftime("%B %d, %Y at %I:%M %p UTC")
        _send_notification(user, task, due_str, timing)
    else:
        # Fallback 24h reminder if no offset configured
        if not offset:
            window_24h_start = now + timedelta(hours=23, minutes=50)
            window_24h_end = now + timedelta(hours=24, minutes=10)
            if window_24h_start <= due <= window_24h_end:
                due_str = due.strftime("%B %d, %Y at %I:%M %p UTC")
                _send_notification(user, task, due_str, "in 24 hours")


def _handle_recurring_reminder(db: Session, user: models.User, task: models.Task, now: datetime):
    try:
        h, m = map(int, task.reminder_time.split(":"))
    except Exception:
        return

    task_minute = h * 60 + m
    now_minute = now.hour * 60 + now.minute
    if abs(now_minute - task_minute) > WINDOW_MINUTES:
        return

    today = now.date()
    already_done = db.query(models.TaskCompletion).filter(
        models.TaskCompletion.task_id == task.id,
        models.TaskCompletion.completed_date == today,
    ).first()
    if already_done:
        return

    due_str = f"today at {task.reminder_time}"
    _send_notification(user, task, due_str, "today")


def _describe_timing(offset_minutes: int, due: datetime, now: datetime) -> str:
    if offset_minutes == 0:
        return "right now"
    if offset_minutes < 60:
        return f"in {offset_minutes} minutes"
    if offset_minutes == 60:
        return "in 1 hour"
    if offset_minutes < 1440:
        return f"in {offset_minutes // 60} hours"
    return "tomorrow"


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
        trigger=IntervalTrigger(minutes=5),
        id="reminder_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — checking reminders every 5 minutes")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped")
