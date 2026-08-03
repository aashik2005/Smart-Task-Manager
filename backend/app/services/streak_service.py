from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from .. import models

BADGE_RULES = {
    "first_task":            lambda u: u.total_completed >= 1,
    "streak_7":              lambda u: u.current_streak >= 7,
    "tasks_30":              lambda u: u.total_completed >= 30,
    "tasks_100":             lambda u: u.total_completed >= 100,
    "consistency_champion":  lambda u: u.longest_streak >= 30,
}


def update_streak(db: Session, user: models.User, task_type: str) -> None:
    today = datetime.now(timezone.utc).date()

    user.total_completed = (user.total_completed or 0) + 1

    last = user.last_activity_date
    if last is None or last < today - timedelta(days=1):
        user.current_streak = 1
    elif last == today - timedelta(days=1):
        user.current_streak = (user.current_streak or 0) + 1
    # else last == today: already counted, just bump total_completed (done above)

    user.longest_streak = max(user.longest_streak or 0, user.current_streak)
    user.last_activity_date = today

    _check_badges(user, task_type)
    flag_modified(user, "badges")
    db.commit()


def _check_badges(user: models.User, task_type: str) -> None:
    earned = list(user.badges or [])

    for key, condition in BADGE_RULES.items():
        if key not in earned and condition(user):
            earned.append(key)

    if task_type == "target" and "goal_achiever" not in earned:
        earned.append("goal_achiever")

    user.badges = earned


def get_weekly_completion_rate(db: Session, user_id: int) -> float:
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)

    completions = (
        db.query(models.TaskCompletion.completed_date)
        .filter(
            models.TaskCompletion.user_id == user_id,
            models.TaskCompletion.completed_date > week_ago,
        )
        .distinct()
        .all()
    )

    unique_days = len(completions)
    # Also count one_time / target completions from tasks updated_at in the window
    one_time_days = (
        db.query(
            models.Task.updated_at
        )
        .filter(
            models.Task.user_id == user_id,
            models.Task.status == models.StatusEnum.completed,
            models.Task.updated_at >= datetime.now(timezone.utc) - timedelta(days=7),
            models.Task.task_type.in_([models.TaskTypeEnum.one_time, models.TaskTypeEnum.target]),
        )
        .all()
    )
    unique_ot_dates = {r[0].date() for r in one_time_days if r[0]}
    all_days = set(r[0] for r in completions) | unique_ot_dates
    unique_days = len(all_days)

    return round((unique_days / 7) * 100, 1)
