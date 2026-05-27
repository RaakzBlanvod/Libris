from sqlalchemy import select, func, false, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from .models import Review, ReviewLike
from .schemas import ReviewCreate, ReviewUpdate
from src.modules.books.models import Book


class ReviewService:
    @staticmethod
    async def create_review(
        db: AsyncSession, user_id: int, book_id: int, review_in: ReviewCreate
    ) -> Review:
        """
        Создает новую рецензию и обновляет средний рейтинг книги.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.
            book_id: ID книги.
            review_in: Данные для создания рецензии.

        Returns:
            Review: Созданный отзыв с подгруженными данными пользователя.

        Raises:
            ValueError: Если пользователь уже оставлял отзыв на эту книгу или книга не найдена.
        """
        existing_stmt = select(Review).where(
            Review.user_id == user_id, Review.book_id == book_id
        )
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise ValueError("Вы уже оставили отзыв на эту книгу.")

        book_stmt = select(Book).where(Book.id == book_id)
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()

        if not book:
            raise ValueError("Книга не найдена в базе данных.")

        ratings = [
            review_in.plot_rating,
            review_in.characters_rating,
            review_in.style_rating,
            review_in.pacing_rating,
            review_in.world_rating,
        ]
        overall = sum(ratings) / 5.0

        new_review = Review(
            **review_in.model_dump(),
            user_id=user_id,
            overall_rating=round(overall, 2),
            book_id=book_id,
        )
        db.add(new_review)

        new_total_count = book.reviews_count + 1
        new_avg_rating = (
            (book.average_rating * book.reviews_count) + overall
        ) / new_total_count

        book.average_rating = round(new_avg_rating, 2)
        book.reviews_count = new_total_count

        await db.commit()

        stmt = (
            select(Review)
            .where(Review.id == new_review.id)
            .options(selectinload(Review.user))
        )
        result = await db.execute(stmt)
        review = result.scalar_one()
        review.like_count = 0
        review.is_liked = False
        return review

    @staticmethod
    async def get_book_reviews(
        db: AsyncSession, book_id: int, current_user_id: int | None = None
    ) -> list[Review]:
        """
        Получает список рецензий для конкретной книги.

        Args:
            db: Асинхронная сессия базы данных.
            book_id: ID книги.
            current_user_id: ID текущего пользователя для проверки лайков.

        Returns:
            list[Review]: Список рецензий с информацией о лайках.
        """
        like_count_subq = (
            select(func.count(ReviewLike.user_id))
            .where(ReviewLike.review_id == Review.id)
            .scalar_subquery()
            .label("like_count")
        )

        if current_user_id:
            is_liked_subq = (
                select(ReviewLike.user_id)
                .where(
                    ReviewLike.review_id == Review.id,
                    ReviewLike.user_id == current_user_id,
                )
                .exists()
                .correlate(Review)
                .label("is_liked")
            )
        else:
            is_liked_subq = false().label("is_liked")

        stmt = (
            select(Review, like_count_subq, is_liked_subq)
            .where(Review.book_id == book_id)
            .options(selectinload(Review.user))
            .order_by(Review.created_at.desc())
        )
        result = await db.execute(stmt)

        reviews = []
        for row in result.all():
            review, like_count, is_liked = row
            review.like_count = like_count
            review.is_liked = is_liked
            reviews.append(review)

        return reviews

    @staticmethod
    async def get_my_reviews(db: AsyncSession, user_id: int) -> list[Review]:
        """
        Получает список рецензий текущего пользователя.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.

        Returns:
            list[Review]: Список рецензий с информацией о лайках.
        """
        like_count_subq = (
            select(func.count(ReviewLike.user_id))
            .where(ReviewLike.review_id == Review.id)
            .scalar_subquery()
            .label("like_count")
        )

        is_liked_subq = (
            select(ReviewLike.user_id)
            .where(ReviewLike.review_id == Review.id, ReviewLike.user_id == user_id)
            .exists()
            .correlate(Review)
            .label("is_liked")
        )

        stmt = (
            select(Review, like_count_subq, is_liked_subq)
            .where(Review.user_id == user_id)
            .options(selectinload(Review.book))
            .order_by(Review.created_at.desc())
        )
        result = await db.execute(stmt)

        reviews = []
        for row in result.all():
            review, like_count, is_liked = row
            review.like_count = like_count
            review.is_liked = is_liked
            reviews.append(review)

        return reviews

    @staticmethod
    async def get_my_liked_review_ids(db: AsyncSession, user_id: int) -> list[int]:
        """
        Получает список ID рецензий, которые лайкнул текущий пользователь.
        Для раскраски лайков на фронтенде поверх кэша.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.

        Returns:
            list[int]: Список ID рецензий, которые лайкнул текущий пользователь.
        """
        stmt = select(ReviewLike.review_id).where(ReviewLike.user_id == user_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_review(
        db: AsyncSession, review_id: int, user_id: int, review_in: ReviewUpdate
    ) -> Review:
        """
        Обновляет существующую рецензию.

        Args:
            db: Асинхронная сессия базы данных.
            review_id: ID рецензии.
            user_id: ID пользователя.
            review_in: Данные для обновления рецензии.

        Returns:
            Review: Обновленная рецензия.

        Raises:
            ValueError: Если рецензия не найдена или пользователь не является автором.
        """
        stmt = select(Review).where(Review.id == review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Отзыв не найден")

        if review.user_id != user_id:
            raise ValueError("Вы не можете редактировать чужой отзыв")

        old_overall_rating = review.overall_rating

        update_data = review_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(review, key, value)

        ratings = [
            review.plot_rating,
            review.characters_rating,
            review.style_rating,
            review.pacing_rating,
            review.world_rating,
        ]
        new_overall_rating = round(sum(ratings) / 5.0, 2)
        review.overall_rating = new_overall_rating

        if old_overall_rating != new_overall_rating:
            book_stmt = select(Book).where(Book.id == review.book_id)
            book_res = await db.execute(book_stmt)
            book = book_res.scalar_one_or_none()

            if book and book.reviews_count > 0:
                old_sum = book.average_rating * book.reviews_count
                new_sum = old_sum - old_overall_rating + new_overall_rating
                book.average_rating = round(new_sum / book.reviews_count, 2)

        await db.commit()

        like_count_subq = (
            select(func.count(ReviewLike.user_id))
            .where(ReviewLike.review_id == Review.id)
            .scalar_subquery()
            .label("like_count")
        )

        is_liked_subq = (
            select(ReviewLike.user_id)
            .where(ReviewLike.review_id == Review.id, ReviewLike.user_id == user_id)
            .exists()
            .correlate(Review)
            .label("is_liked")
        )

        stmt_refresh = (
            select(Review, like_count_subq, is_liked_subq)
            .where(Review.id == review.id)
            .options(selectinload(Review.user))
        )
        res_refresh = await db.execute(stmt_refresh)

        row = res_refresh.one()

        updated_review = row.Review
        updated_review.like_count = row.like_count or 0
        updated_review.is_liked = row.is_liked or False

        return updated_review

    @staticmethod
    async def delete_review(db: AsyncSession, review_id: int, user_id: int) -> None:
        """
        Удаляет рецензию.

        Args:
            db: Асинхронная сессия базы данных.
            review_id: ID рецензии.
            user_id: ID пользователя.

        Raises:
            ValueError: Если рецензия не найдена или пользователь не является автором.
        """
        stmt = select(Review).where(Review.id == review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Отзыв не найден")

        if review.user_id != user_id:
            raise ValueError("Вы не можете удалить чужой отзыв")

        await db.delete(review)

        book_stmt = select(Book).where(Book.id == review.book_id)
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()

        if book:
            new_total_count = book.reviews_count - 1
            if new_total_count > 0:
                new_avg_rating = (
                    (book.average_rating * book.reviews_count) - review.overall_rating
                ) / new_total_count
            else:
                new_avg_rating = 0.0

            book.average_rating = round(new_avg_rating, 2)
            book.reviews_count = new_total_count

        await db.commit()

    @staticmethod
    async def toggle_like(
        db: AsyncSession, user_id: int, review_id: int
    ) -> dict[str, bool]:
        """
        Переключает лайк на рецензии.

        Args:
            db: Асинхронная сессия базы данных.
            user_id: ID пользователя.
            review_id: ID рецензии.

        Returns:
            dict[str, bool]: Состояние лайка после переключения.

        Raises:
            ValueError: Если рецензия не найдена.
        """
        stmt = select(ReviewLike).where(
            ReviewLike.review_id == review_id, ReviewLike.user_id == user_id
        )
        result = await db.execute(stmt)
        existing_like = result.scalar_one_or_none()

        if existing_like:
            await db.delete(existing_like)
            await db.commit()
            return {"is_liked": False}
        else:
            new_like = ReviewLike(review_id=review_id, user_id=user_id)
            db.add(new_like)
            try:
                await db.commit()
                return {"is_liked": True}
            except IntegrityError:
                await db.rollback()
                raise ValueError("Рецензия не найдена")

    @staticmethod
    async def get_trending_reviews(db: AsyncSession, limit: int = 10) -> list[Review]:
        """
        Получает топ рецензий, набравших больше всего лайков за последние 7 дней.

        Args:
            db: Асинхронная сессия базы данных.
            limit: Максимальное количество результатов.

        Returns:
            list[Review]: Список трендовых рецензий.
        """
        week_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)

        likes_subq = (
            select(
                ReviewLike.review_id,
                func.count(ReviewLike.user_id).label("recent_likes_count"),
            )
            .where(ReviewLike.created_at >= week_ago)
            .group_by(ReviewLike.review_id)
            .subquery()
        )

        total_likes_subq = (
            select(func.count(ReviewLike.user_id))
            .where(ReviewLike.review_id == Review.id)
            .scalar_subquery()
            .label("like_count")
        )

        stmt = (
            select(Review, total_likes_subq)
            .join(likes_subq, Review.id == likes_subq.c.review_id)
            .options(selectinload(Review.user))
            .order_by(desc(likes_subq.c.recent_likes_count))
            .limit(limit)
        )

        res = await db.execute(stmt)

        trending_reviews = []
        for row in res.all():
            review, like_count = row
            review.like_count = like_count
            review.is_liked = False  # Для кэша дашборда всегда отдаем False
            trending_reviews.append(review)

        return trending_reviews
