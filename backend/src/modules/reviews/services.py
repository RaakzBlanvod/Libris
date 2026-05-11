from sqlalchemy import select, func, false
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from .models import Review, ReviewLike
from .schemas import ReviewCreate, ReviewUpdate
from src.modules.books.models import Book


class ReviewService:
    @staticmethod
    async def create_review(
        db: AsyncSession, user_id: int, review_in: ReviewCreate
    ) -> Review:
        """
        Создает новую рецензию и обновляет средний рейтинг книги.

        Args:
            db: асинхронная сессия
            user_id: id пользователя
            review_in: схема отзыва

        Returns:
            Review: созданный отзыв с подгруженными данными пользователя

        Raises:
            ValueError: если юзер уже оставлял отзыв на эту книгу или книга не найдена в базе данных
        """
        # 1. Проверка на дубликат отзыва
        existing_stmt = select(Review).where(
            Review.user_id == user_id, Review.book_id == review_in.book_id
        )
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise ValueError("Вы уже оставили отзыв на эту книгу.")

        # 2. Расчет рейтинга конкретного отзыва
        ratings = [
            review_in.plot_rating,
            review_in.characters_rating,
            review_in.style_rating,
            review_in.pacing_rating,
            review_in.world_rating,
        ]
        overall = sum(ratings) / 5.0

        # 3. Создание отзыва
        new_review = Review(
            **review_in.model_dump(), user_id=user_id, overall_rating=round(overall, 2)
        )
        db.add(new_review)

        # 4. Поиск книги для обновления статистики
        book_stmt = select(Book).where(Book.id == review_in.book_id)
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()

        if not book:
            raise ValueError("Книга не найдена в базе данных.")

        # 5. Математика обновления книги (SQLAlchemy сама сделает UPDATE при коммите)
        new_total_count = book.reviews_count + 1
        new_avg_rating = (
            (book.average_rating * book.reviews_count) + overall
        ) / new_total_count

        book.average_rating = round(new_avg_rating, 2)
        book.reviews_count = new_total_count

        # Сохраняем всё разом
        await db.commit()

        # 6. Финальная подгрузка для ответа фронтенду
        # Делаем отдельный запрос, чтобы гарантированно получить объект с User
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
    async def update_review(
        db: AsyncSession, review_id: int, user_id: int, review_in: ReviewUpdate
    ) -> Review:
        stmt = select(Review).where(Review.id == review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Отзыв не найден")

        if review.user_id != user_id:
            raise ValueError("Вы не можете редактировать чужой отзыв")

        old_overall_rating = review.overall_rating

        # Обновляем поля
        update_data = review_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(review, key, value)

        # Пересчитываем общий рейтинг
        ratings = [
            review.plot_rating,
            review.characters_rating,
            review.style_rating,
            review.pacing_rating,
            review.world_rating,
        ]
        new_overall_rating = round(sum(ratings) / 5.0, 2)
        review.overall_rating = new_overall_rating

        # Обновляем рейтинг книги, если он изменился
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
        stmt = select(Review).where(Review.id == review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Отзыв не найден")

        if review.user_id != user_id:
            raise ValueError("Вы не можете удалить чужой отзыв")

        await db.delete(review)
        await db.commit()

        # Найдем книгу и вычтем рейтинг
        book_stmt = select(Book).where(Book.id == review.book_id)
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()

        if book:
            # Математика обратного действия
            new_total_count = book.reviews_count - 1
            if new_total_count > 0:
                # Вычитаем вклад удаленного отзыва
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
