from pydantic import BaseModel , EmailStr

class AccessToken(BaseModel):
    access_token : str
    token_type : str | None = None

class RefreshToken(BaseModel):
    refresh_token : str

class TOKEN(BaseModel):
    access_token : str
    refresh_token : str
    token_type : str


class UserBase(BaseModel):
    username : str


class UserLogin(UserBase):
    password : str

class UserLoginResponse(UserBase):
    user_id : int 
    first_name: str | None = None
    last_name : str | None = None
    role_name : str | None = None
    token : TOKEN | None = None


class UserRegister(UserLogin):
    first_name : str
    last_name : str
    email : EmailStr
