from pydantic import BaseModel
from datetime import datetime


class OrderBase(BaseModel):
    date : datetime


class OrderResponse(OrderBase):
    order_id : int
    user_id : int
    game_id : int
    first_name : str
    last_name : str
    game_name : str
    price : int
    date : datetime
    image : str
    is_success : bool

