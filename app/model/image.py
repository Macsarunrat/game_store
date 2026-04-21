from sqlmodel import SQLModel, Field


class Image(SQLModel,table=True):
    id : int | None = Field(primary_key=True)
    image : str
    is_main : bool
    game_id : int = Field(foreign_key="game.id")