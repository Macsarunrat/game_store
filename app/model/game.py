from sqlmodel import SQLModel, Field, Relationship


class Game_Genre(SQLModel,table=True):
    game_id : int = Field(foreign_key="game.id",primary_key=True)
    genre_id : int = Field(foreign_key="genre.id",primary_key=True)

class Game(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    shop_id : int = Field(foreign_key="shop.id")
    name : str
    description : str
    price : int
    genre : list["Genre"] = Relationship(back_populates="game", link_model=Game_Genre)


class Genre(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    name : str
    game : list['Game'] = Relationship(back_populates='genre', link_model=Game_Genre)
