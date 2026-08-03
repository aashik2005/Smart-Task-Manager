from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict
from datetime import datetime, timezone, date, timedelta
import calendar as cal_module

from .. import models, schemas, auth
from ..database import get_db
from ..services import streak_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _inject_completed_today(task: models.Task, db: Session, user_id: int) -> dict:
    today = datetime.now(timezone.utc).date()
    is_done = False
    if task.task_type in (models.TaskTypeEnum.daily, models.TaskTypeEnum.weekly):
        is_done = bool(
            db.query(models.TaskCompletion).filter(
                models.TaskCompletion.task_id == task.id,
                models.TaskCompletion.completed_date == today,
            ).first()
        )
    out = schemas.TaskOut.model_validate(task).model_dump()
    out["is_completed_today"] = is_done
    return out


def _today_tasks(tasks: list, db: Session, user_id: int) -> List[dict]:
    now = datetime.now(timezone.utc)
    today = now.date()
    today_name = now.strftime("%A").lower()
    result = []
    for task in tasks:
        include = False
        if task.task_type == models.TaskTypeEnum.daily and task.is_active:
            include = True
        elif task.task_type == models.TaskTypeEnum.weekly and task.is_active:
            days = task.recurrence_days or []
            include = today_name in days
        elif task.due_date:
            due_local = task.due_date.replace(tzinfo=timezone.utc) if task.due_date.tzinfo is None else task.due_date
            include = due_local.date() == today
        if include:
            result.append(_inject_completed_today(task, db, user_id))
    return result


# ── Task CRUD ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.TaskOut])
def get_tasks(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    task_type_filter: Optional[str] = Query(None, alias="task_type"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = (
        db.query(models.Task)
        .options(selectinload(models.Task.milestones))
        .filter(models.Task.user_id == current_user.id)
    )

    if search:
        query = query.filter(
            or_(
                models.Task.title.ilike(f"%{search}%"),
                models.Task.description.ilike(f"%{search}%"),
            )
        )
    if status_filter:
        try:
            query = query.filter(models.Task.status == models.StatusEnum(status_filter))
        except ValueError:
            pass
    if priority_filter:
        try:
            query = query.filter(models.Task.priority == models.PriorityEnum(priority_filter))
        except ValueError:
            pass
    if category_filter:
        try:
            query = query.filter(models.Task.category == models.CategoryEnum(category_filter))
        except ValueError:
            pass
    if task_type_filter:
        try:
            query = query.filter(models.Task.task_type == models.TaskTypeEnum(task_type_filter))
        except ValueError:
            pass

    tasks = query.order_by(models.Task.sort_order.asc(), models.Task.created_at.desc()).all()
    return [_inject_completed_today(t, db, current_user.id) for t in tasks]


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    data = task_data.model_dump()
    # Auto-assign sort_order = max + 1
    from sqlalchemy import func as sa_func
    max_order = db.query(sa_func.max(models.Task.sort_order)).filter(
        models.Task.user_id == current_user.id
    ).scalar() or 0
    data["sort_order"] = max_order + 1

    task = models.Task(**data, user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    db.expire(task, ["milestones"])
    db.refresh(task)
    return _inject_completed_today(task, db, current_user.id)


@router.get("/dashboard", response_model=schemas.DashboardData)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    now = datetime.now(timezone.utc)

    all_tasks = (
        db.query(models.Task)
        .options(selectinload(models.Task.milestones))
        .filter(models.Task.user_id == current_user.id)
        .all()
    )

    total = len(all_tasks)
    pending = sum(1 for t in all_tasks if t.status == models.StatusEnum.pending)
    in_progress = sum(1 for t in all_tasks if t.status == models.StatusEnum.in_progress)
    completed_count = sum(1 for t in all_tasks if t.status == models.StatusEnum.completed)
    overdue = sum(
        1 for t in all_tasks
        if t.due_date and
        (t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date) < now
        and t.status != models.StatusEnum.completed
    )

    today_tasks = _today_tasks(all_tasks, db, current_user.id)

    overdue_tasks = [
        _inject_completed_today(t, db, current_user.id)
        for t in all_tasks
        if t.due_date and
        (t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date) < now
        and t.status != models.StatusEnum.completed
    ][:5]

    goal_tasks = [
        _inject_completed_today(t, db, current_user.id)
        for t in all_tasks
        if t.task_type == models.TaskTypeEnum.target and t.status != models.StatusEnum.completed
    ]

    recent_completions = [
        _inject_completed_today(t, db, current_user.id)
        for t in sorted(
            [t for t in all_tasks if t.status == models.StatusEnum.completed],
            key=lambda x: x.updated_at,
            reverse=True,
        )[:5]
    ]

    rate = streak_service.get_weekly_completion_rate(db, current_user.id)

    return schemas.DashboardData(
        total=total,
        pending=pending,
        in_progress=in_progress,
        completed=completed_count,
        overdue=overdue,
        current_streak=current_user.current_streak or 0,
        longest_streak=current_user.longest_streak or 0,
        total_completed=current_user.total_completed or 0,
        weekly_completion_rate=rate,
        today_tasks=today_tasks,
        overdue_tasks=overdue_tasks,
        goal_tasks=goal_tasks,
        recent_completions=recent_completions,
        badges=list(current_user.badges or []),
    )


@router.get("/calendar", response_model=Dict[str, List[schemas.CalendarTaskOut]])
def get_calendar(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    today = datetime.now(timezone.utc).date()
    first_day = date(year, month, 1)
    last_day = date(year, month, cal_module.monthrange(year, month)[1])

    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()

    result: Dict[str, list] = {}
    for day_num in range(1, last_day.day + 1):
        day = date(year, month, day_num)
        day_name = day.strftime("%A").lower()
        day_str = day.isoformat()
        result[day_str] = []

        for task in tasks:
            include = False
            if task.task_type == models.TaskTypeEnum.daily and task.is_active:
                include = True
            elif task.task_type == models.TaskTypeEnum.weekly and task.is_active:
                include = day_name in (task.recurrence_days or [])
            elif task.task_type in (models.TaskTypeEnum.one_time, models.TaskTypeEnum.target):
                if task.due_date:
                    td = task.due_date.replace(tzinfo=timezone.utc) if task.due_date.tzinfo is None else task.due_date
                    include = td.date() == day

            if include:
                is_done = False
                if task.task_type in (models.TaskTypeEnum.daily, models.TaskTypeEnum.weekly):
                    is_done = bool(
                        db.query(models.TaskCompletion).filter(
                            models.TaskCompletion.task_id == task.id,
                            models.TaskCompletion.completed_date == day,
                        ).first()
                    )
                else:
                    is_done = task.status == models.StatusEnum.completed

                cal_task = schemas.CalendarTaskOut.model_validate(task)
                cal_dict = cal_task.model_dump()
                cal_dict["is_completed_today"] = is_done
                result[day_str].append(cal_dict)

    return result


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = (
        db.query(models.Task)
        .options(selectinload(models.Task.milestones))
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _inject_completed_today(task, db, current_user.id)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = (
        db.query(models.Task)
        .options(selectinload(models.Task.milestones))
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in task_data.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _inject_completed_today(task, db, current_user.id)


@router.patch("/{task_id}/complete", response_model=schemas.TaskOut)
def mark_complete(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = (
        db.query(models.Task)
        .options(selectinload(models.Task.milestones))
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    today = datetime.now(timezone.utc).date()

    if task.task_type in (models.TaskTypeEnum.daily, models.TaskTypeEnum.weekly):
        try:
            completion = models.TaskCompletion(
                task_id=task.id,
                user_id=current_user.id,
                completed_date=today,
            )
            db.add(completion)
            db.flush()
            streak_service.update_streak(db, current_user, task.task_type.value)
        except IntegrityError:
            db.rollback()
    else:
        task.status = models.StatusEnum.completed
        if task.task_type == models.TaskTypeEnum.target:
            task.progress = 100
        db.flush()
        streak_service.update_streak(db, current_user, task.task_type.value)

    db.commit()
    db.refresh(task)
    return _inject_completed_today(task, db, current_user.id)


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_tasks(
    items: List[schemas.TaskReorderItem],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    ids = [item.id for item in items]
    tasks = db.query(models.Task).filter(
        models.Task.id.in_(ids),
        models.Task.user_id == current_user.id,
    ).all()

    task_map = {t.id: t for t in tasks}
    for item in items:
        if item.id in task_map:
            task_map[item.id].sort_order = item.sort_order

    db.commit()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


# ── Milestones ────────────────────────────────────────────────────────────────

def _get_task_or_404(task_id: int, user_id: int, db: Session) -> models.Task:
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.user_id == user_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/{task_id}/milestones", response_model=List[schemas.MilestoneOut])
def get_milestones(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_task_or_404(task_id, current_user.id, db)
    return db.query(models.Milestone).filter(
        models.Milestone.task_id == task_id
    ).order_by(models.Milestone.sort_order).all()


@router.post("/{task_id}/milestones", response_model=schemas.MilestoneOut, status_code=201)
def create_milestone(
    task_id: int,
    data: schemas.MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_task_or_404(task_id, current_user.id, db)
    milestone = models.Milestone(**data.model_dump(), task_id=task_id)
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.put("/{task_id}/milestones/{milestone_id}", response_model=schemas.MilestoneOut)
def update_milestone(
    task_id: int,
    milestone_id: int,
    data: schemas.MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_task_or_404(task_id, current_user.id, db)
    milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.task_id == task_id,
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(milestone, field, value)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{task_id}/milestones/{milestone_id}", status_code=204)
def delete_milestone(
    task_id: int,
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_task_or_404(task_id, current_user.id, db)
    milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.task_id == task_id,
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
