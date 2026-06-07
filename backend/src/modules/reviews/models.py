from typing import TYPE_CHECKING, List

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, created_at, intpk, updated_at

if TYPE_CHECKING:
    from src.modules.books.models import Book
    from src.modules.users.models import User


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[intpk]
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"))

    plot_rating: Mapped[int] = mapped_column(
        CheckConstraint(
            "plot_rating >= 1 AND plot_rating <= 10", name="ck_reviews_plot_rating"
        )
    )
    plot_text: Mapped[str]

    characters_rating: Mapped[int] = mapped_column(
        CheckConstraint(
            "characters_rating >= 1 AND characters_rating <= 10",
            name="ck_reviews_characters_rating",
        )
    )
    characters_text: Mapped[str]

    style_rating: Mapped[int] = mapped_column(
        CheckConstraint(
            "style_rating >= 1 AND style_rating <= 10", name="ck_reviews_style_rating"
        )
    )
    style_text: Mapped[str]

    pacing_rating: Mapped[int] = mapped_column(
        CheckConstraint(
            "pacing_rating >= 1 AND pacing_rating <= 10",
            name="ck_reviews_pacing_rating",
        )
    )
    pacing_text: Mapped[str]

    world_rating: Mapped[int] = mapped_column(
        CheckConstraint(
            "world_rating >= 1 AND world_rating <= 10", name="ck_reviews_world_rating"
        )
    )
    world_text: Mapped[str]

    overall_rating: Mapped[float]
    general_text: Mapped[str]

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    user: Mapped["User"] = relationship(back_populates="reviews")
    book: Mapped["Book"] = relationship(back_populates="reviews")
    likes: Mapped[List["ReviewLike"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )


class ReviewLike(Base):
    __tablename__ = "review_likes"

    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[created_at]

    review: Mapped["Review"] = relationship(back_populates="likes")
    user: Mapped["User"] = relationship(back_populates="review_likes")
