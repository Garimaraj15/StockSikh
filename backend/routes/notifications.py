from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from models.notification import Notification
from models.user import User
from routes.auth import get_current_user
from utils.email_service import send_email_alert, get_trade_email_template

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponseItem(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    action_url: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: Optional[str] = None


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponseItem]
    unread_count: int


class TestEmailRequest(BaseModel):
    recipient_email: str
    symbol: str = "TATAMOTORS.NS"
    quantity: int = 10
    price: float = 980.50


@router.get("", response_model=NotificationListResponse)
@router.get("/", response_model=NotificationListResponse)
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns only the authenticated user's notifications, newest first.
    Calculates the real unread count directly from the database.
    """
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )

    items = [
        NotificationResponseItem(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            action_url=n.action_url,
            related_entity_type=n.related_entity_type,
            related_entity_id=n.related_entity_id,
            created_at=n.created_at.isoformat() if n.created_at else None
        )
        for n in notifs
    ]

    return NotificationListResponse(
        notifications=items,
        unread_count=unread_count
    )


@router.post("/{notif_id}/read")
@router.post("/{notif_id}/read/")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks a single notification as read, strictly scoped to current_user.id.
    """
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found or access denied."
        )

    notif.is_read = True
    db.commit()

    return {
        "success": True,
        "message": "Notification marked as read.",
        "id": notif_id
    }


@router.post("/mark-all-read")
@router.post("/mark-all-read/")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks all unread notifications for the authenticated current_user as read.
    """
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()

    return {
        "success": True,
        "message": "All notifications marked as read.",
        "marked_count": updated_count
    }


@router.delete("/{notif_id}")
@router.delete("/{notif_id}/")
@router.post("/{notif_id}/delete")
@router.post("/{notif_id}/delete/")
def delete_single_notification(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes a single notification belonging to the current user.
    """
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found or access denied."
        )

    db.delete(notif)
    db.commit()

    return {
        "success": True,
        "message": "Notification deleted successfully.",
        "id": notif_id
    }


@router.delete("/clear-all")
@router.delete("/clear-all/")
@router.post("/clear-all")
@router.post("/clear-all/")
def clear_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently removes all notifications for the authenticated user.
    """
    deleted_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()

    return {
        "success": True,
        "message": "All notifications cleared.",
        "deleted_count": deleted_count
    }


@router.post("/test-email")
def send_test_email(req: TestEmailRequest, current_user: User = Depends(get_current_user)):
    html_content = get_trade_email_template(
        username=getattr(current_user, "name", "Trader"),
        symbol=req.symbol,
        trade_type="BUY",
        quantity=req.quantity,
        price=req.price,
        total_amount=req.quantity * req.price
    )
    sent = send_email_alert(req.recipient_email, f"Paper Trade Executed: {req.symbol}", html_content)
    return {"status": "success" if sent else "failed", "dispatched": sent}

