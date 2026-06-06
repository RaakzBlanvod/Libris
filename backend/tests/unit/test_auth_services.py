import pytest
from unittest.mock import AsyncMock, patch

from src.modules.auth.services import AuthService
from src.modules.users.models import User
from src.core.security import get_password_hash


@patch("src.modules.auth.services.get_user_by_email", new_callable=AsyncMock)
async def test_authenticate_user_not_found(mock_get_user):
    mock_get_user.return_value = None
    mock_db = AsyncMock()

    with pytest.raises(ValueError, match="Пользователь с таким email не найден"):
        await AuthService.authenticate_user(mock_db, "noone@example.com", "password")


@patch("src.modules.auth.services.get_user_by_email", new_callable=AsyncMock)
async def test_authenticate_user_wrong_password(mock_get_user):
    mock_user = User()
    mock_user.hashed_password = get_password_hash("correctpassword")
    mock_get_user.return_value = mock_user
    mock_db = AsyncMock()

    with pytest.raises(ValueError, match="Неверный пароль"):
        await AuthService.authenticate_user(mock_db, "user@example.com", "wrongpassword")


@patch("src.modules.auth.services.get_user_by_email", new_callable=AsyncMock)
async def test_authenticate_user_success(mock_get_user):
    mock_user = User()
    mock_user.email = "user@example.com"
    mock_user.hashed_password = get_password_hash("correctpassword")
    mock_get_user.return_value = mock_user
    mock_db = AsyncMock()

    result = await AuthService.authenticate_user(mock_db, "user@example.com", "correctpassword")
    assert result is mock_user