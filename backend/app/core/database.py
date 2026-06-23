from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel, create_engine, Session
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
POSTGRES_URL = os.getenv("POSTGRES_URL")
if POSTGRES_URL and POSTGRES_URL.startswith("postgresql://"):
    POSTGRES_URL = POSTGRES_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(POSTGRES_URL, echo=True)

async def create_db_and_tb():
    from app.model.game import Game,Catagory,Game_catagory
    from app.model.image import Image
    from app.model.order import Order
    from app.model.user import Role,User
    from app.model.chat import Chat_History, Friends
    from app.model.logs import Game_Logs,Image_Logs
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    

async def get_database_session():
    async with AsyncSession(engine) as session:
        yield session