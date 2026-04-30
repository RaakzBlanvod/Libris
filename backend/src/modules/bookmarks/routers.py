from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.modules.bookmarks.schemas import (
    BookmarkCreate,
    BookmarkResponse,
    BookmarkStatus,
)
from src.modules.bookmarks.services import BookmarkService
from src.modules.users.models import User
from src.core.deps import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.post("/", response_model=BookmarkResponse, status_code=status.HTTP_200_OK)
async def toggle_bookmark(
    bookmark_in: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        bookmark = await BookmarkService.toggle_bookmark(
            db, current_user.id, bookmark_in
        )
        return bookmark
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[BookmarkResponse], status_code=status.HTTP_200_OK)
async def get_bookmarks(
    status: Optional[BookmarkStatus] = Query(
        None, description="Фильтр по статусу закладки"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bookmarks = await BookmarkService.get_user_bookmarks(db, current_user.id, status)
    return bookmarks


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await BookmarkService.delete_bookmark(db, current_user.id, book_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
