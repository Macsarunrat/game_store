from fastapi import APIRouter,Depends,HTTPException,status, Query
from ..schema.game import GameResponse,GameCreate,GameCatagoryResponse,GameDelete,GameUpdate,CatagoryResponse,BuyGameRequest
from ..schema.template import ResponseTemplate,ResponseTemplateConstructor
from ..dependencies import DbSession,RequirePermission,get_user, get_redis
from ..crud import game as crud_game
from typing import Annotated
import json
from .order import ordered_notification
import redis.asyncio as redis
from app.core.channel import new_order_channel


router = APIRouter(
    prefix= '/game',
    tags=['game']
)

@router.get('/',response_model=ResponseTemplate[list[GameResponse]])
async def get_all_game(
    db: DbSession,
    current_user : Annotated[str,Depends(RequirePermission(required_permission=['admin','customer','owner']))],
    cache : Annotated[redis.Redis,Depends(get_redis)]
    ):

    cache_key = "game:all:"

    cache_data = await cache.get(cache_key)

    if cache_data:
        print('=' *50)
        print("Load from redis")
        print('=' *50)
        data = json.loads(cache_data)
        return ResponseTemplateConstructor(200,'OK','get successfully', data)

    
    results =  await crud_game.get_all_game(db)

    await cache.set(cache_key,json.dumps(results), ex=60)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)

@router.get('/angular',response_model=ResponseTemplate[list[GameResponse]])
async def get_all_game(db: DbSession):
    results =  await crud_game.get_all_game(db)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)


@router.post('/create-game',response_model=ResponseTemplate[dict])
async def create_game(
    db:DbSession, body: GameCreate,
    current_user : Annotated[str,Depends(RequirePermission(['owner']))],
    cache : Annotated[redis.Redis,Depends(get_redis)]):
    game_name = body.name
    description = body.description
    price = body.price
    catagory = body.catagories
    results_id = await crud_game.create_game(
        db=db,game_name=game_name,description=description,price=price,catagory=catagory)
    
    response = {'ไอดีที่เพิ่ม': results_id}
    await cache.delete("game:all:")
    return ResponseTemplateConstructor(200,'OK','get successfully',response)


@router.delete('/delete', response_model=ResponseTemplate[str])
async def delete_game(
    db: DbSession, game_id : Annotated[list[int],Query()], 
    current_user : Annotated[str,Depends(RequirePermission(['owner']))],
    cache : Annotated[redis.Redis, Depends(get_redis)]):
    game_id = game_id
    if not game_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail='กรุณาใส่ไอดีเกมที่ต้องการจะลบ')
    await crud_game.delete_game(db=db,game_id=game_id)
    await cache.delete("game:all:")
    return ResponseTemplateConstructor('200','OK','Delete Successfully',None)

@router.patch('/update-info',response_model=ResponseTemplate[str])
async def update_game(db:DbSession, body: GameUpdate, current_user : Annotated[str,Depends(RequirePermission(['admin','owner']))]):
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


@router.get('/catagory', response_model=ResponseTemplate[list[CatagoryResponse]])
async def get_catagory(db: DbSession, current_user : Annotated[str,Depends(RequirePermission(['customer','admin','owner']))]):
    results = await crud_game.get_catagory(db)
    return ResponseTemplateConstructor('200','OK','Get catagory Successfully', results)



@router.post('/buy',response_model=ResponseTemplate[str])
async def buy_game(db: DbSession, 
                   body : BuyGameRequest, 
                   current_user : Annotated[str, Depends(RequirePermission(['customer']))], 
                   user_data : Annotated[str,Depends(get_user)],
                   redis_client : Annotated[redis.Redis,Depends(get_redis)]
                   
                   ):
    print("USER DATA")
    print(user_data)
    user_id = user_data['user_id']
    game_id = body.game_id

    await crud_game.buy_game(db,user_id,game_id)


    message = {'user_id':int(user_id),'game_id': int(game_id)}
    json_data = json.dumps(message,ensure_ascii=False)

    await redis_client.publish(channel=new_order_channel,message=json_data)

    return ResponseTemplateConstructor(200,'OK','ทำรายการสั่งซื้อสำเร็จ',None) 

# @router.post('/customer_game', response_model=ResponseTemplate[str])
# async def customer_game(db: DbSession, user_id : int):
