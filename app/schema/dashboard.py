from pydantic import BaseModel


class Header(BaseModel):
    total_income : int
    best_seller_game : str
    total_order : int
    active_user_a_day : int

class DonutChart(BaseModel):
    category_name : str
    income : int
    avg : str

class BarChart(BaseModel):
    username : str
    total_spending : int


class TrendlineChart(BaseModel):
    date : str
    income : int