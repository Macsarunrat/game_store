from xxlimited import Str

from pydantic import BaseModel
from .images import Images
from enum import Enum


class GameBase(BaseModel):
    name : str
    description : str
    price : int
    
    catagories : list[str | None] | None = None

class GameResponse(GameBase):
    is_hidden : bool
    game_id : int
    images : list[Images]

class CatagoryResponse(BaseModel):
    catagory_id : int
    catagory_name : str 

class GameCatagoryResponse(BaseModel):
    game_list : list[GameResponse]
    catagories_list : list[CatagoryResponse] | None = None
    

class GameCreate(GameBase):
    catagories : list[int]


class GameDelete(BaseModel):
    game_id : list[int]


class GameUpdate(BaseModel):
    game_id : int | None = None
    name : str | None = None
    description : str | None = None
    price : int | None = None
    catagories : list[int] | None = None



class BuyGameRequest(BaseModel):
    game_id : int



class GameStripe(BaseModel):
    order_id : int
    checkout: str
    mode : str

class GameHiddenStatus(str,Enum):
    hide = True
    show = False

class GameHiddenRequest(BaseModel):
    game_id : int
    is_hidden : bool


    