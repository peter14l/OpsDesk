from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.agency import Agency
from app.schemas.user import UserOut
from app.schemas.agency import AgencyOut

router = APIRouter(tags=["Users & Agencies"])


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    out = []
    for u in users:
        out.append(UserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            region=u.region,
            skills=u.skills,
            availability_status=u.availability_status,
            max_concurrency=u.max_concurrency,
            active_ticket_count=u.active_ticket_count,
            created_at=u.created_at,
        ))
    return out


@router.get("/agencies", response_model=List[AgencyOut])
def list_agencies(db: Session = Depends(get_db)):
    return db.query(Agency).all()
