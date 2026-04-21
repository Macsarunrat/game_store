from fastapi import Depends
from sqlmodel import Session
from app.core.database import engine
from typing import Annotated




def get_db():
    with Session(engine) as session :
        yield session

DbSession = Annotated[Session,Depends(get_db)]