from sqlmodel import SQLModel,Field,text
from datetime import datetime,timezone



class Role(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str

# class Permission(SQLModel,table=True):
#     id : int | None = Field(primary_key=True)
#     name : str
#     role_id : int = Field(foreign_key="role.id")


class User(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    username : str = Field(unique=True)
    password : str
    first_name : str
    last_name :str
    role_id : int = Field(foreign_key="role.id")
    email : str | None = None

class User_Refresh_Token(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    user_id : int = Field(foreign_key='user.id')
    jti : str
    is_active : bool = Field(default=True, sa_column_kwargs={"server_default":"true"})
    create_at : datetime = Field(default_factory=datetime.now(timezone.utc),sa_column_kwargs={"server_default": text('CURRENT_TIMESTAMP')})