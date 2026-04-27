from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base, intpk, created_at, updated_at


class User(Base):
    __tablename__ = "users"

    id: Mapped[intpk]
    email: Mapped[str] = mapped_column(
        String(length=320), unique=True, index=True, nullable=False
    )
    username: Mapped[str] = mapped_column(String(length=50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true"
    )

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    def __repr__(self) -> str:
        return f"<User {self.username}>"
