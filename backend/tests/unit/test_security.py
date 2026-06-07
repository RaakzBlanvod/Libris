import jwt
import pytest
from datetime import timedelta

from src.core.config import settings
from src.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)


def test_verify_password_success():
    hashed = get_password_hash("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_failure():
    hashed = get_password_hash("mypassword")
    assert verify_password("notmypassword", hashed) is False


def test_create_access_token_payload():
    token = create_access_token(data={"sub": "email@example.com"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "email@example.com"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token_payload():
    token = create_refresh_token(data={"sub": "email@example.com"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "email@example.com"
    assert payload["type"] == "refresh"
    assert "exp" in payload


def test_access_token_expires():
    token = create_access_token(
        data={"sub": "email@example.com"}, expires_delta=timedelta(seconds=-1)
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True},
        )


def test_tokens_type_are_different():
    access = create_access_token(data={"sub": "email@example.com"})
    refresh = create_refresh_token(data={"sub": "email@example.com"})
    access_payload = jwt.decode(
        access, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
    )
    refresh_payload = jwt.decode(
        refresh, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
    )
    assert access_payload["type"] == "access"
    assert refresh_payload["type"] == "refresh"
