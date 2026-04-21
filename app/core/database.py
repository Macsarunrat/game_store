from sqlmodel import SQLModel, create_engine
import os
from dotenv import load_dotenv

load_dotenv()
POSTGRES_URL = os.getenv("POSTGRES_URL")

engine = create_engine(POSTGRES_URL, echo=True)

def create_db_and_tb():
    from app.model.customer import Customer
    from app.model.game import Game,Genre,Game_Genre
    from app.model.image import Image
    from app.model.order import Order
    from app.model.shop import Shop
    from app.model.user import Role,Permission,User
    SQLModel.metadata.create_all(engine)
