from sqlmodel import SQLModel,Field


class Role(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str

class Permission(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str
    role_id : int = Field(foreign_key="role.id")


class User(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    username : str 
    password : str
    role : int = Field(foreign_key="role.id")
