import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.modules.users.services import UserService
from src.modules.users.schemas import UserCreate


@patch("src.modules.users.services.get_user_by_email", new_callable=AsyncMock)
@patch("src.modules.users.services.get_user_by_username", new_callable=AsyncMock)
async def test_create_user_email_already_exists(
    mock_get_by_username, mock_get_by_email
):
    mock_get_by_email.return_value = MagicMock()
    mock_db = AsyncMock()

    user_in = UserCreate(
        email="exists@example.com", username="newuser", password="password"
    )

    with pytest.raises(ValueError, match="Email уже используется."):
        await UserService.create_user(mock_db, user_in)


async def test_upload_avatar_invalid_type():
    mock_db = AsyncMock()
    mock_user = MagicMock()

    mock_file = MagicMock()
    mock_file.content_type = "image/gif"

    with pytest.raises(ValueError, match="Разрешены только форматы JPEG, PNG или WEBP"):
        await UserService.upload_avatar(mock_db, mock_user, mock_file)


async def test_upload_avatar_too_large():
    mock_db = AsyncMock()
    mock_user = MagicMock()

    mock_file = MagicMock()
    mock_file.content_type = "image/jpeg"
    mock_file.read = AsyncMock(return_value=b"x" * (5 * 1024 * 1024 + 1))

    with pytest.raises(ValueError, match="Размер файла не должен превышать 5 МБ"):
        await UserService.upload_avatar(mock_db, mock_user, mock_file)
