from pydantic import BaseModel


class GameBase(BaseModel):
    game_id : int
    name : str
    description : str
    price : int
    catagories : list[str] | None = None

class GameResponse(GameBase):
    pass