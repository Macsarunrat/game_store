from sqlmodel import SQLModel, Field
from datetime import datetime

class Order(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key="user.id")
    game_id : int = Field(foreign_key="game.id")
    date : datetime = Field(default_factory=datetime.now())
    