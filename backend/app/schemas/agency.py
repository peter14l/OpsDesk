from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class AgencyBase(BaseModel):
    code: str
    name: str
    tier: str = "STANDARD"
    region: str = "GLOBAL"
    country_code: str = "AE"
    account_manager: Optional[str] = None


class AgencyCreate(AgencyBase):
    pass


class AgencyOut(AgencyBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
