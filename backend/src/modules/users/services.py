from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.users.models import User
from src.modules.users.schemas import UserCreate
from src.core.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


class UserService:
    @staticmethod
    async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
        if await get_user_by_email(db, email=user_in.email):
            raise ValueError("Email already registered")

        if await get_user_by_username(db, username=user_in.username):
            raise ValueError("Username already taken")

        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
        user = await get_user_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
