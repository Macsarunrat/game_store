from fastapi import APIRouter,Depends,HTTPException,status, Query, Request, BackgroundTasks
from httpcore import AnyIOBackend

from app.utils.stripe import Stripe
from ....schema.game import GameResponse,GameCreate,GameCatagoryResponse,GameDelete,GameUpdate,CatagoryResponse,BuyGameRequest
from ....schema.template import ResponseTemplate,ResponseTemplateConstructor
from ....dependencies import DbSession,RequirePermission,get_user, get_redis
from ....crud import game as crud_game
from typing import Annotated, Any
import json
from .order import ordered_notification
import redis.asyncio as redis
from app.utils.channel import new_order_channel
from ....crud.logs import save_log
from ....model.logs import Game_Logs
from ....crud.logs import game_log
import stripe




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

    await cache.set(cache_key,json.dumps(results), ex=1000)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)

@router.get('/angular',response_model=ResponseTemplate[list[GameResponse]])
async def get_all_game(db: DbSession):
    results =  await crud_game.get_all_game(db)

    return ResponseTemplateConstructor(200,'OK','get successfully',results)


@router.post('/create-game',response_model=ResponseTemplate[dict])
async def create_game(
    db:DbSession, body: GameCreate,
    current_user : Annotated[str,Depends(RequirePermission(['owner']))],
    cache : Annotated[redis.Redis,Depends(get_redis)],
    request : Request,
    background_task : BackgroundTasks
    ):
    game_name = body.name
    description = body.description
    price = body.price
    catagory = body.catagories
    game_id = await crud_game.create_game(db=db,game_name=game_name,description=description,price=price,catagory=catagory)
    
    response = {'ไอดีที่เพิ่ม': game_id}
    await cache.delete("game:all:")

    user_id = current_user.get('user_id')
    background_task.add_task(game_log,user_id,game_id,"CREATE",request.client.host,None)
    return ResponseTemplateConstructor(200,'OK','get successfully',response)


@router.delete('/delete', response_model=ResponseTemplate[str])
async def delete_game(
    db: DbSession, game_id : Annotated[list[int],Query()], 
    current_user : Annotated[str,Depends(RequirePermission(['owner']))],
    cache : Annotated[redis.Redis, Depends(get_redis)],
    request : Request,
    background_task : BackgroundTasks
    ):
    game_id = game_id
    if not game_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail='กรุณาใส่ไอดีเกมที่ต้องการจะลบ')
    await crud_game.delete_game(db=db,game_id=game_id)
    await cache.delete("game:all:")

    user_id = current_user.get('user_id')
    background_task.add_task(game_log,user_id,game_id,"DELETE",request.client.host,None)
    return ResponseTemplateConstructor('200','OK','Delete Successfully',None)

@router.patch('/update-info',response_model=ResponseTemplate[str])
async def update_game(
    db:DbSession, 
    body: GameUpdate, 
    current_user : Annotated[str,Depends(RequirePermission(['admin','owner']))],
    request : Request,
    background_task : BackgroundTasks,
    cache : Annotated[redis.Redis,Depends(get_redis)]
    ):
    game_name = body.name
    description = body.description
    price = body.price
    catagory = body.catagories
    game_id = body.game_id

    old_data = await crud_game.get_game_by_id(db=db,game_id=game_id)
    await crud_game.update_game(
        game_name=game_name,
        description=description,
        price=price,
        catagory=catagory,
        game_id=game_id,
        db=db)
    
    new_data = body.model_dump(exclude_unset=True)
    #new_data = {'name': game_name,'description': description,'price':price} 
    print("="*100)
    print('OLD data')
    print(game_id)

    print(old_data)
    print('='*100)
    user_id = current_user.get('user_id')
    payload = await check_diff(new_data,old_data)
    background_task.add_task(game_log,user_id,game_id,"UPDATE", request.client.host,payload)
    await cache.delete("game:all:")

    return ResponseTemplateConstructor('200','OK','Update Successfully',None)


@router.get('/catagory', response_model=ResponseTemplate[list[CatagoryResponse]])
async def get_catagory(
    db: DbSession, 
    current_user : Annotated[str,Depends(RequirePermission(['customer','admin','owner']))],
    cache: Annotated[redis.Redis, Depends(get_redis)]
    ):

    cache_key = "catagory:all"

    cache_data = await cache.get(cache_key)
    if cache_data:
        data = json.loads(cache_data)
        print('='*300)
        print(data)
        print('='*300)
        return ResponseTemplateConstructor('200','OK','Get catagory Successfully', data)

    results = await crud_game.get_catagory(db)
    dict_data = [dict(i) for i in results]
    await cache.set(cache_key,json.dumps(dict_data), ex=1000)
    
    return ResponseTemplateConstructor('200','OK','Get catagory Successfully', results)



@router.post('/buy',response_model=ResponseTemplate[Any])
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

    results = await crud_game.buy_game(db,user_id,game_id)
    order_id = results['order_id']
    game_price = results['price']
    game_name = results['name']
    game_description = results['description']
    customer_email = results['email']

    #alert zone
    message = {'user_id':int(user_id),'game_id': int(game_id),'type':'new_order'}
    json_data = json.dumps(message,ensure_ascii=False)
    await redis_client.publish(channel=new_order_channel,message=json_data)

    # success_url = f"http://localhost:4200/payment/success?order_id={order_id}"
    # cancel_url = f"http://localhost:4200/payment/cancel?order_id={order_id}"


    try:
        session = await Stripe.strip_create_session(game_price=game_price,order_id=order_id,game_name=game_name,game_description=game_description,customer_email=customer_email)
        # session = stripe.checkout.Session.create(
        #     payment_method_types=['promptpay','card'],
        #     line_items= [
        #         {
        #             'price_data':{
        #                 'currency':'thb',
        #                 'product_data': {'name':f'Game id {game_id}'},
        #                 'unit_amount': (game_price*100)
        #             },
        #             "quantity":1
        #         }
        #     ],
        #     mode='payment',
        #     success_url=success_url,
        #     cancel_url=cancel_url,
        #     metadata= {
        #         'order_id' : order_id
        #     }

        # )

        #save order_id in database
        await crud_game.save_session(db,order_id=order_id,session_id=session.id)

        success_message = {
            "order_id": order_id,
            "checkout": session.url,
            'mode': "stripe"
        }
        return ResponseTemplateConstructor(200,'OK','ทำรายการสำเร็จไปยัง stripe เพื่อทำการชำระเงิน',success_message) 
    except Exception as e:
        print(f'Stripe Payment System Error : {e}')

    return ResponseTemplateConstructor(200,'OK','ทำรายการสั่งซื้อสำเร็จ',None) 

# @router.post('/customer_game', response_model=ResponseTemplate[str])
# async def customer_game(db: DbSession, user_id : int):




async def check_diff(new_data : dict, old_data: dict):
    try:
        intersec_keys = new_data.keys() & old_data.keys()
        data_diff = {k : {'new_data':new_data[k],'old_data':old_data[k]} for k in intersec_keys if new_data[k] != old_data[k]}
        print('='*50)
        print('DATA DIFF')
        print(data_diff)
        print('='*50)
        return data_diff
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Error check diff {e}')
    
