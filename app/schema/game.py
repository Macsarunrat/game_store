from pydantic import BaseModel


class GameBase(BaseModel):
    name : str
    description : str
    price : int
    catagories : list[str] | None = None

class GameResponse(GameBase):
    game_id : int
    

class GameCreate(GameBase):
    pass