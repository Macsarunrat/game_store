from sqlmodel import SQLModel, Field, text
from datetime import datetime
from sqlalchemy import UniqueConstraint



class Friends(SQLModel, table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key='user.id')
    friend_id : int = Field(foreign_key='user.id')
    status : str
    created_at : datetime = Field(default=datetime.now(), sa_column_kwargs={'server_default': text('CURRENT_TIMESTAMP')})
    requester_id : int = Field(foreign_key='user.id')

    __table_args__ = (
        UniqueConstraint('user_id','friend_id', name="unique_constraint"),

    )


class Chat_History(SQLModel, table=True):
    id : int | None = Field(primary_key=True)
    sender_id : int = Field(foreign_key='user.id')
    friendship_id : int = Field(foreign_key='friends.id')
    created_at : datetime = Field(default_factory=datetime.now, sa_column_kwargs={'server_default': text('CURRENT_TIMESTAMP')})
    message : str