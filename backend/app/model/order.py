from sqlmodel import SQLModel, Field,text
from datetime import datetime
from sqlalchemy import UniqueConstraint

class Order(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key="user.id")
    game_id : int = Field(foreign_key="game.id")
    date : datetime = Field(default_factory=datetime.now,sa_column_kwargs={'server_default': text('CURRENT_TIMESTAMP')})
    is_success : bool = Field(sa_column_kwargs={'server_default': "false"})
    stripe_session_id : str | None = None

    __table_args__ =(
        UniqueConstraint('user_id','game_id', name="unique_user_game"),

    )
    