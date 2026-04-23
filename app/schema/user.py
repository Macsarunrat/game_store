from pydantic import BaseModel

class AccessToken(BaseModel):
    access_key : str
    type : str | None = None

class RefreshToken(BaseModel):
    refresh_key : str

class TOKEN(BaseModel):
    access_key : str
    refresh_key : str


class UserBase(BaseModel):
    username : str


class UserLogin(UserBase):
    password : str

class UserLoginResponse(UserBase):
    first_name: str | None = None
    last_name : str | None = None
    role_name : str | None = None
    token : TOKEN | None = None
