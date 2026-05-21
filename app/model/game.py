from sqlmodel import SQLModel, Field, Relationship


class Game_catagory(SQLModel,table=True):
    game_id : int = Field(foreign_key="game.id",primary_key=True,ondelete="CASCADE")
    catagory_id : int = Field(foreign_key="catagory.id",primary_key=True,ondelete="CASCADE")

class Game(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str
    description : str
    price : int
    catagory : list["Catagory"] = Relationship(back_populates="game", link_model=Game_catagory)
    is_active : bool = Field(default=True,sa_column_kwargs={'server_default': "true"})


class Catagory(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str
    game : list['Game'] = Relationship(back_populates='catagory', link_model=Game_catagory)
