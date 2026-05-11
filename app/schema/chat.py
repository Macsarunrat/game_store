from pydantic import BaseModel



class AddFriend(BaseModel):
    user_id : int
    friend_id : int

