from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base, intpk, created_at, updated_at

if TYPE_CHECKING:
    from src.modules.users.models import User
    from src.modules.books.models import Book


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[intpk]
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"))

    # "Reading", "Finished", "Planned", "Dropped"
    status: Mapped[str] = mapped_column(String(20), default="Planned")

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    # Связи, чтобы Книга и Юзер знали о закладке
    user: Mapped["User"] = relationship(back_populates="bookmarks")
    book: Mapped["Book"] = relationship(back_populates="bookmarks")
