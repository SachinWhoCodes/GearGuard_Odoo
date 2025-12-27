"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2025-12-27

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("admin", "manager", "technician", "requester", name="user_role"), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "teams",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("member_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "equipment",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("serial_number", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("department", sa.String(length=80), nullable=False),
        sa.Column("owner_employee_name", sa.String(length=120), nullable=False),
        sa.Column("purchase_date", sa.String(length=20), nullable=False),
        sa.Column("warranty_expiry", sa.String(length=20), nullable=False),
        sa.Column("location", sa.String(length=200), nullable=False),
        sa.Column("maintenance_team_id", sa.String(length=36), nullable=False),
        sa.Column("default_technician_id", sa.String(length=36), nullable=False),
        sa.Column("is_scrapped", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("scrapped_at", sa.String(length=30), nullable=True),
        sa.Column("scrapped_reason", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_equipment_serial_number", "equipment", ["serial_number"], unique=False)

    op.create_table(
        "maintenance_requests",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("type", sa.Enum("corrective", "preventive", name="request_type"), nullable=False),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1200), nullable=False),
        sa.Column("equipment_id", sa.String(length=36), nullable=False),
        sa.Column("equipment_category", sa.String(length=80), nullable=False),
        sa.Column("maintenance_team_id", sa.String(length=36), nullable=False),
        sa.Column("scheduled_date", sa.String(length=20), nullable=True),
        sa.Column("duration_hours", sa.Float(), nullable=True),
        sa.Column("assigned_to_id", sa.String(length=36), nullable=True),
        sa.Column("created_by_id", sa.String(length=36), nullable=False),
        sa.Column("stage", sa.Enum("new", "in_progress", "repaired", "scrap", name="request_stage"), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("maintenance_requests")
    op.drop_index("ix_equipment_serial_number", table_name="equipment")
    op.drop_table("equipment")
    op.drop_table("teams")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS request_stage")
    op.execute("DROP TYPE IF EXISTS request_type")
    op.execute("DROP TYPE IF EXISTS user_role")
