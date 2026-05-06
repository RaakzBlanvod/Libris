from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, intpk, created_at, updated_at

if TYPE_CHECKING:
    from src.modules.users.models import User

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[intpk]
    token: Mapped[str] = mapped_column(String(length=1024), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    user: Mapped["User"] = relationship("User")
