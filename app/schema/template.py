from pydantic import BaseModel
from typing import Optional, Generic,TypeVar


T = TypeVar("T")

class ResponseTemplate(BaseModel, Generic[T]):
    status_code : int
    status : str
    message : str
    detail : Optional[T] = None


class ResponseTemplateConstructor():
    def __init__(self, status_code, status, message, detail):
        self.status_code = status_code
        self.status = status
        self.message = message
        self.detail = detail