from sqlmodel import SQLModel, Field


class Order(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    customer_id : int = Field(foreign_key="customer.id")
    game_id : int = Field(foreign_key="game.id")
    