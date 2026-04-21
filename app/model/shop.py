from sqlmodel import SQLModel, Field


class Shop(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key="user.id")
    name : str
    description : str