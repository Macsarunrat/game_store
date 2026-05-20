

from pydantic_settings import BaseSettings,SettingsConfigDict


class Settings(BaseSettings):
    stripe_secret_key : str
    stripe_publishable_key : str
    stripe_webhook : str
    domain : str = "http://localhost:8000"

    POSTGRES_URL:str

    ALGORITHM:str
    ACCESS_TOKEN_EXPIRE_MINUTES:int
    SECRET_KEY:str

    POSTGRES_USER:str
    POSTGRES_PASSWORD:str
    POSTGRES_DB:str

    REDIS_URL:str

    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM_NAME:str


    model_config = SettingsConfigDict(env_file='...env')

settings = Settings()
