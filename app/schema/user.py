from pydantic import BaseModel

class Key(BaseModel):
    access_key : str
    refresh_key : str

class UserBase(BaseModel):
    username : str


class UserLogin(UserBase):
    password : str

class UserLoginResponse(UserBase):
    first_name: str | None = None
    last_name : str | None = None
    name : str | None = None
    description : str | None = None
    role : int | None = None
    key : Key | None = None
