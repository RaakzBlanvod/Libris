from typing import List, TYPE_CHECKING

from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, intpk, created_at, updated_at

if TYPE_CHECKING:
    from src.modules.bookmarks.models import Bookmark
    from src.modules.reviews.models import Review, ReviewLike


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
    avatar: Mapped[str | None] = mapped_column(String(length=1024), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(length=1024), nullable=True)
    favorite_genres: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(length=100)), nullable=True
    )

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    bookmarks: Mapped[List["Bookmark"]] = relationship(
        "Bookmark", back_populates="user", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="user", cascade="all, delete-orphan"
    )

    review_likes: Mapped[List["ReviewLike"]] = relationship(
        "ReviewLike", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"
