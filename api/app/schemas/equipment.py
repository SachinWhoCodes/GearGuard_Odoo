from pydantic import Field

from app.schemas.common import APIModel


class EquipmentOut(APIModel):
    id: str
    name: str
    serial_number: str
    category: str
    department: str
    owner_employee_name: str
    purchase_date: str
    warranty_expiry: str
    location: str
    maintenance_team_id: str
    default_technician_id: str
    is_scrapped: bool = False
    scrapped_at: str | None = None
    scrapped_reason: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class EquipmentCreate(APIModel):
    name: str = Field(min_length=1, max_length=120)
    serial_number: str = Field(min_length=1, max_length=80)
    category: str
    department: str
    owner_employee_name: str
    purchase_date: str
    warranty_expiry: str
    location: str
    maintenance_team_id: str
    default_technician_id: str
    is_scrapped: bool = False


class EquipmentUpdate(APIModel):
    name: str | None = None
    serial_number: str | None = None
    category: str | None = None
    department: str | None = None
    owner_employee_name: str | None = None
    purchase_date: str | None = None
    warranty_expiry: str | None = None
    location: str | None = None
    maintenance_team_id: str | None = None
    default_technician_id: str | None = None
    is_scrapped: bool | None = None
    scrapped_reason: str | None = None
