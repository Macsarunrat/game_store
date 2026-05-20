from pydantic import BaseModel
from datetime import datetime



class AddFriend(BaseModel):
    user_id : int
    friend_id : int

class Friend(BaseModel):
    friend_id : int

class Lasted_Message(BaseModel):
    message : str
    time : datetime

class All_Friend(BaseModel):
    id : int
    first_name : str
    last_name : str
    status : str | None = None
    lasted_message : str | None = None
    time : datetime | None = None 
    
