

from pydantic_settings import BaseSettings,SettingsConfigDict


class Settings(BaseSettings):
    stripe_secret_key : str
    stripe_publishable_key : str
    stripe_webhook : str
    domain : str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file='...env')

settings = Settings()
