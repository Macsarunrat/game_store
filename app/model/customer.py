from sqlmodel import SQLModel,Field


class Customer(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key="user.id")
    first_name : str
    last_name :str
    