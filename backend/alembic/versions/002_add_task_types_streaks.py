"""Add task types, streaks, milestones, task_completions

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Create new enum types (safe for re-runs)
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE tasktypeenum AS ENUM ('one_time', 'daily', 'weekly', 'target');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE categoryenum AS ENUM ('study', 'work', 'personal', 'health', 'others');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # Extend users table
    op.add_column("users", sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("last_activity_date", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("total_completed", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("badges", sa.JSON(), nullable=True, server_default=sa.text("'[]'::json")))

    # Extend tasks table
    op.add_column("tasks", sa.Column("task_type", sa.Enum("one_time", "daily", "weekly", "target", name="tasktypeenum"), nullable=False, server_default="one_time"))
    op.add_column("tasks", sa.Column("category", sa.Enum("study", "work", "personal", "health", "others", name="categoryenum"), nullable=True))
    op.add_column("tasks", sa.Column("color_label", sa.String(7), nullable=True))
    op.add_column("tasks", sa.Column("start_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tasks", sa.Column("target_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tasks", sa.Column("recurrence_days", sa.JSON(), nullable=True))
    op.add_column("tasks", sa.Column("reminder_time", sa.String(5), nullable=True))
    op.add_column("tasks", sa.Column("reminder_offset_minutes", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("tasks", sa.Column("progress", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tasks", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("tasks", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("tasks", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))

    # Create milestones table
    op.create_table(
        "milestones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_milestones_id", "milestones", ["id"], unique=False)

    # Create task_completions table
    op.create_table(
        "task_completions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("completed_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "completed_date"),
    )
    op.create_index("ix_task_completions_id", "task_completions", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_task_completions_id", table_name="task_completions")
    op.drop_table("task_completions")
    op.drop_index("ix_milestones_id", table_name="milestones")
    op.drop_table("milestones")

    for col in ["sort_order", "is_active", "notes", "progress", "reminder_offset_minutes",
                "reminder_time", "recurrence_days", "target_date", "start_date",
                "color_label", "category", "task_type"]:
        op.drop_column("tasks", col)

    for col in ["badges", "total_completed", "last_activity_date", "longest_streak", "current_streak"]:
        op.drop_column("users", col)

    conn = op.get_bind()
    conn.execute(sa.text("DROP TYPE IF EXISTS tasktypeenum"))
    conn.execute(sa.text("DROP TYPE IF EXISTS categoryenum"))
