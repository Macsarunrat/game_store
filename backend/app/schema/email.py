from unittest.mock import Base

from pydantic import BaseModel, EmailStr




class EmailRequest(BaseModel):
    email : EmailStr
    subject : str
    body : str

class SendEmail(BaseModel):
    email : EmailStr
    customer_name : str
    order_id : int
    game : str
    price : int


