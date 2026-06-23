from typing import List

from pydantic import BaseModel
from enum import Enum

from app.crud import game


class Header(BaseModel):
    total_income : int | None = None
    best_seller_game : str | None = None
    total_order : int | None = None
    active_user_a_day : int | None = None

class DonutChart(BaseModel):
    category_name : str
    income : int
    avg : str

class GameList(BaseModel):
    game_name : str | None = None
    count_order : int | None = None

class DonutChartByCategory(BaseModel):
    category_name : str | None = None
    game_list : List[GameList]

class BarChart(BaseModel):
    username : str
    total_spending : int


class TrendlineChart(BaseModel):
    date : str
    income : int
    

class ResponseTrendLineChart(BaseModel):
    trend_data : List[TrendlineChart]
    mode : str


class TimeMode(str,Enum):
    day = "day"
    week = "week"
    month = "month"
    year = "year"
