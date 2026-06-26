from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Literal["admin", "inspector", "operator"] = "inspector"


class InspectionCreate(BaseModel):
    product: str = Field(min_length=2, max_length=120)
    robot: str = Field(min_length=2, max_length=50)
    standard: str = Field(min_length=2, max_length=80)
    scan_mode: Literal["full", "quick", "custom"] = "full"


class ReportUpdate(BaseModel):
    note: str = Field(max_length=2000)
