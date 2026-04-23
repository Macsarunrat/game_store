from fastapi import APIRouter
from ..schema.game import GameResponse
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..dependencies import DbSession
from ..crud import game as crud_game


router = APIRouter(
    prefix= '/game',
    tags=['game']
)



@router.get('/',response_model=ResponseTemplate[list[GameResponse]])
async def get_all_game(db: DbSession):
    results =  await crud_game.get_all_game(db)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)