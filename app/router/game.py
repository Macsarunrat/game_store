from fastapi import APIRouter
from ..schema.game import GameResponse,GameCreate
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


@router.post('/create-game',response_model=ResponseTemplate[GameResponse])
async def create_game(db:DbSession, body: GameCreate):
    return ResponseTemplateConstructor(200,'OK','get successfully')
