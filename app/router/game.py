from fastapi import APIRouter
from ..schema.game import GameResponse,GameCreate,GameCatagoryResponse,GameDelete,GameUpdate
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..dependencies import DbSession
from ..crud import game as crud_game


router = APIRouter(
    prefix= '/game',
    tags=['game']
)



@router.get('/',response_model=ResponseTemplate[GameCatagoryResponse])
async def get_all_game(db: DbSession):
    results =  await crud_game.get_all_game(db)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)


@router.post('/create-game',response_model=ResponseTemplate[dict])
async def create_game(db:DbSession, body: GameCreate):
    game_name = body.name
    description = body.description
    price = body.price
    catagory = body.catagories
    results_id = await crud_game.create_game(
        db=db,game_name=game_name,description=description,price=price,catagory=catagory)
    
    response = {'ไอดีที่เพิ่ม': results_id}
    return ResponseTemplateConstructor(200,'OK','get successfully',response)


@router.post('/delete', response_model=ResponseTemplate[str])
async def delete_game(db: DbSession, body: GameDelete):
    game_id = body.game_id
    await crud_game.delete_game(db=db,game_id=game_id)
    return ResponseTemplateConstructor('200','OK','Delete Successfully',None)

@router.patch('/update-info',response_model=ResponseTemplate[str])
async def update_game(db:DbSession, body: GameUpdate):
    game_name = body.name
    description = body.description
    price = body.price
    catagory = body.catagories
    game_id = body.game_id

    await crud_game.update_game(
        game_name=game_name,
        description=description,
        price=price,
        catagory=catagory,
        game_id=game_id,
        db=db)

    return ResponseTemplateConstructor('200','OK','Update Successfully',None)