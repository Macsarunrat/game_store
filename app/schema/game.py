from pydantic import BaseModel
from .images import Images


class GameBase(BaseModel):
    name : str
    description : str
    price : int
    catagories : list[str] | None = None

class GameResponse(GameBase):
    game_id : int
    images : list[Images]

class CatagoryResponse(BaseModel):
    catagory_id : int
    catagory_name : str

class GameCatagoryResponse(BaseModel):
    game_list : list[GameResponse]
    catagories_list : list[CatagoryResponse]
    

class GameCreate(GameBase):
    pass


class GameDelete(BaseModel):
    game_id : list[int]


class GameUpdate(BaseModel):
    game_id : int | None = None
    name : str | None = None
    description : str | None = None
    price : int | None = None
    catagories : list[str] | None = None