from sqlmodel import SQLModel,Field
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column





class Game_Logs(SQLModel, table=True):
    id : int | None= Field(primary_key=True)
    user_id : int
    game_id : int
    action_type : str
    time : datetime = Field(default_factory=datetime.now)
    ip_address : str
    payload : Optional[Dict[str,Any]] = Field(default=dict, sa_column=Column(JSONB))


class Image_Logs(SQLModel, table=True):
    id : int | None= Field(primary_key=True)
    user_id : int
    image_id : int
    action_type : str
    time : datetime = Field(default_factory=datetime.now)
    ip_address : str
