from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime, date
from .models import PriorityEnum, StatusEnum, TaskTypeEnum, CategoryEnum
import re


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None

    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone_number: Optional[str]
    email_notifications: bool
    whatsapp_notifications: bool
    current_streak: int
    longest_streak: int
    total_completed: int
    badges: List[str]
    last_activity_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    email_notifications: Optional[bool] = None
    whatsapp_notifications: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Milestones ────────────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    title: str
    completed: bool = False
    due_date: Optional[datetime] = None
    sort_order: int = 0

    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Milestone title cannot be empty")
        return v.strip()


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    sort_order: Optional[int] = None


class MilestoneOut(BaseModel):
    id: int
    task_id: int
    title: str
    completed: bool
    due_date: Optional[datetime]
    sort_order: int

    class Config:
        from_attributes = True


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium
    status: StatusEnum = StatusEnum.pending
    task_type: TaskTypeEnum = TaskTypeEnum.one_time
    category: Optional[CategoryEnum] = None
    color_label: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    recurrence_days: Optional[List[str]] = None
    reminder_time: Optional[str] = None
    reminder_offset_minutes: Optional[int] = 0
    progress: int = 0
    notes: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @validator("reminder_time")
    def validate_reminder_time(cls, v):
        if v is not None and not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("reminder_time must be in HH:MM format")
        return v

    @validator("progress")
    def validate_progress(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("progress must be between 0 and 100")
        return v

    @validator("color_label")
    def validate_color_label(cls, v):
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color_label must be a valid hex color (e.g. #FF5733)")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None
    task_type: Optional[TaskTypeEnum] = None
    category: Optional[CategoryEnum] = None
    color_label: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    recurrence_days: Optional[List[str]] = None
    reminder_time: Optional[str] = None
    reminder_offset_minutes: Optional[int] = None
    progress: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

    @validator("progress")
    def validate_progress(cls, v):
        if v is not None and not 0 <= v <= 100:
            raise ValueError("progress must be between 0 and 100")
        return v

    @validator("color_label")
    def validate_color_label(cls, v):
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color_label must be a valid hex color")
        return v


class TaskOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    priority: PriorityEnum
    status: StatusEnum
    task_type: TaskTypeEnum
    category: Optional[CategoryEnum]
    color_label: Optional[str]
    due_date: Optional[datetime]
    start_date: Optional[datetime]
    target_date: Optional[datetime]
    recurrence_days: Optional[List[str]]
    reminder_time: Optional[str]
    reminder_offset_minutes: Optional[int]
    progress: int
    notes: Optional[str]
    is_active: bool
    sort_order: int
    milestones: List[MilestoneOut] = []
    is_completed_today: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardData(BaseModel):
    total: int
    pending: int
    in_progress: int
    completed: int
    overdue: int
    current_streak: int
    longest_streak: int
    total_completed: int
    weekly_completion_rate: float
    today_tasks: List[TaskOut]
    overdue_tasks: List[TaskOut]
    goal_tasks: List[TaskOut]
    recent_completions: List[TaskOut]
    badges: List[str]


# ── Calendar ──────────────────────────────────────────────────────────────────

class CalendarTaskOut(BaseModel):
    id: int
    title: str
    task_type: TaskTypeEnum
    color_label: Optional[str]
    status: StatusEnum
    priority: PriorityEnum
    due_date: Optional[datetime]
    recurrence_days: Optional[List[str]]
    is_completed_today: bool = False

    class Config:
        from_attributes = True


# ── Reorder ───────────────────────────────────────────────────────────────────

class TaskReorderItem(BaseModel):
    id: int
    sort_order: int
