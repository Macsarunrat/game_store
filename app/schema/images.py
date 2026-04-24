from pydantic import BaseModel


class Images(BaseModel):
    image_id : int
    image : str | None = None
    is_main : bool | None = None

class ImageUpload(BaseModel):
    game_id : int
    is_main : bool

class ImageDelete(BaseModel):
    image_id : list[int]