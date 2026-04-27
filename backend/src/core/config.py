from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Находим переменные в .env автоматом через Pydantic
    # Ошибка если не найдем
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str

    REDIS_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Путь к env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Экземпляр для импорта настроек
settings = Settings()
