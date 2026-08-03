from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date,
    ForeignKey, Enum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskTypeEnum(str, enum.Enum):
    one_time = "one_time"
    daily = "daily"
    weekly = "weekly"
    target = "target"


class CategoryEnum(str, enum.Enum):
    study = "study"
    work = "work"
    personal = "personal"
    health = "health"
    others = "others"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    email_notifications = Column(Boolean, default=False, server_default="false")
    whatsapp_notifications = Column(Boolean, default=False, server_default="false")
    current_streak = Column(Integer, default=0, nullable=False, server_default="0")
    longest_streak = Column(Integer, default=0, nullable=False, server_default="0")
    last_activity_date = Column(Date, nullable=True)
    total_completed = Column(Integer, default=0, nullable=False, server_default="0")
    badges = Column(JSON, default=list, server_default="[]")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    completions = relationship("TaskCompletion", back_populates="user", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium, nullable=False, server_default="medium")
    status = Column(Enum(StatusEnum), default=StatusEnum.pending, nullable=False, server_default="pending")
    task_type = Column(Enum(TaskTypeEnum), default=TaskTypeEnum.one_time, nullable=False, server_default="one_time")
    category = Column(Enum(CategoryEnum), nullable=True)
    color_label = Column(String(7), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    target_date = Column(DateTime(timezone=True), nullable=True)
    recurrence_days = Column(JSON, nullable=True)
    reminder_time = Column(String(5), nullable=True)
    reminder_offset_minutes = Column(Integer, nullable=True, server_default="0")
    progress = Column(Integer, default=0, nullable=False, server_default="0")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, server_default="true")
    sort_order = Column(Integer, default=0, nullable=False, server_default="0")
    topic_queue = Column(JSON, nullable=True)
    current_topic_index = Column(Integer, default=0, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="tasks")
    milestones = relationship("Milestone", back_populates="task", cascade="all, delete-orphan", order_by="Milestone.sort_order")
    completions = relationship("TaskCompletion", back_populates="task", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False, server_default="false")
    due_date = Column(DateTime(timezone=True), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False, server_default="0")

    task = relationship("Task", back_populates="milestones")


class TaskCompletion(Base):
    __tablename__ = "task_completions"
    __table_args__ = (UniqueConstraint("task_id", "completed_date"),)

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    completed_date = Column(Date, nullable=False)

    task = relationship("Task", back_populates="completions")
    user = relationship("User", back_populates="completions")
