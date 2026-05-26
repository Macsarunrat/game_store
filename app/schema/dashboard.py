from pydantic import BaseModel


class Header(BaseModel):
    total_income : int | None = None
    best_seller_game : str | None = None
    total_order : int | None = None
    active_user_a_day : int | None = None

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