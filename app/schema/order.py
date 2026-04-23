from pydantic import BaseModel
from datetime import datetime


class OrderBase(BaseModel):
    date : datetime


class OrderResponse(OrderBase):
    order_id : int
    first_name : str
    last_name : str
    game_name : str
