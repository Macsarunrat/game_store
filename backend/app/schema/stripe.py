from pydantic import BaseModel



class PaymentRequest(BaseModel):
    amount : int 
    currency : str
    customer_email : str
