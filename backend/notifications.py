from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Notification
from typing import List, Optional
from utils import decode_access_token
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    """Extract user ID from JWT token in Authorization header"""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return decode_access_token(token)
    except Exception:
        return None


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    reservation_id: Optional[int]
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str
    reservation_id: Optional[int] = None


@router.post("/", response_model=NotificationOut)
def create_notification(notif: NotificationCreate, db: Session = Depends(get_db)):
    """Create a new notification"""
    db_notif = Notification(
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        reservation_id=notif.reservation_id,
        read=False
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif


@router.get("/", response_model=List[NotificationOut])
def get_notifications(user_id: Optional[int] = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get all notifications for the current user"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).all()
    
    return notifications


@router.put("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db)):
    """Mark a notification as read"""
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.delete("/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
