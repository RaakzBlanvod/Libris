from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Table, Column, Integer, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, intpk, created_at, updated_at

if TYPE_CHECKING:
    from src.modules.reviews.models import Review
    from src.modules.bookmarks.models import Bookmark

# Связующие Table для many-to-many
book_authors = Table(
    "book_authors",
    Base.metadata,
    Column(
        "book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "author_id",
        Integer,
        ForeignKey("authors.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

book_genres = Table(
    "book_genres",
    Base.metadata,
    Column(
        "book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "genre_id",
        Integer,
        ForeignKey("genres.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# Модели
class Author(Base):
    __tablename__ = "authors"

    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )

    books: Mapped[List["Book"]] = relationship(
        secondary=book_authors, back_populates="authors"
    )

    def __repr__(self) -> str:
        return f"<Author {self.name}>: {self.id}"


class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )

    books: Mapped[List["Book"]] = relationship(
        secondary=book_genres, back_populates="genres"
    )

    def __repr__(self) -> str:
        return f"<Genre {self.name}>: {self.id}"


class Book(Base):
    __tablename__ = "books"

    id: Mapped[intpk]
    google_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    cover_url: Mapped[Optional[str]] = mapped_column(String(500))
    page_count: Mapped[Optional[int]]
    isbn: Mapped[Optional[str]] = mapped_column(String(20), index=True)

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    authors: Mapped[List["Author"]] = relationship(
        secondary=book_authors, back_populates="books", lazy="selectin"
    )
    genres: Mapped[List["Genre"]] = relationship(
        secondary=book_genres, back_populates="books", lazy="selectin"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="book", cascade="all, delete-orphan"
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(
        "Bookmark", back_populates="book", cascade="all, delete-orphan"
    )
    average_rating: Mapped[float] = mapped_column(default=0.0)
    reviews_count: Mapped[int] = mapped_column(default=0)

    def __repr__(self) -> str:
        return f"<Book {self.title}>: {self.id}"
