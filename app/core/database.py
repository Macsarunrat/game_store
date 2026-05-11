from sqlmodel import SQLModel, create_engine
import os
from dotenv import load_dotenv

load_dotenv()
POSTGRES_URL = os.getenv("POSTGRES_URL")

engine = create_engine(POSTGRES_URL, echo=True)

def create_db_and_tb():
    from app.model.game import Game,Catagory,Game_catagory
    from app.model.image import Image
    from app.model.order import Order
    from app.model.user import Role,User
    from app.model.chat import Chat_History, Friends
    SQLModel.metadata.create_all(engine)

