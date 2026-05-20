from fastapi import APIRouter,Depends, BackgroundTasks, Request
from ....dependencies import DbSession,RequirePermission,get_redis,get_user
from ....crud import order as crud_order
from ....schema.template import ResponseTemplate, ResponseTemplateConstructor
from ....schema.order import OrderResponse
from typing import Annotated
from fastapi.sse import ServerSentEvent, EventSourceResponse
from collections.abc import AsyncIterable
from fastapi.encoders import jsonable_encoder
import redis.asyncio as redis
import asyncio
import json
from app.utils.channel import new_order_channel, confirm_ordered
from app.schema.email import SendEmail
from app.utils.email import send_email

router = APIRouter(
    prefix='/order',
    tags=['order']
)


@router.get('/',response_model=ResponseTemplate[list[OrderResponse]])
async def get_order(db : DbSession,current_user : Annotated[str,Depends(RequirePermission(['customer','admin','owner']))]):
    results = await crud_order.get_order(db)
    return ResponseTemplateConstructor(200,'OK','get order successfully',results)
    

@router.patch('/confirm', response_model= ResponseTemplate[str])
async def confirm_order(db : DbSession, 
                        current_user : Annotated[str, Depends(RequirePermission(['owner','admin']))], 
                        order_id : int,
                        redis_client : Annotated[redis.Redis, Depends(get_redis)],
                        background_tasks : BackgroundTasks
                        ):
    """
    สำหรับยืนยันออเดอร์ที่เข้ามา
    """
    print("Order ID")
    print(order_id)
    result = await crud_order.update_status(db=db,order_id=order_id)
    user_id = result.get('user_id')
    
    #for alert to customer
    channel = f'{confirm_ordered}:user_id:{user_id}'
    message = {'order_id':order_id,'type': 'confirm_order'}
    json_data = json.dumps(message)
    await redis_client.publish(channel=str(channel),message=json_data)
    #for realtime order status
    channel = new_order_channel
    await redis_client.publish(channel=channel,message=json_data)

    #for send email 
    email_detail = await crud_order.get_order_by_id(db,order_id=order_id)
    print(email_detail)
    data = {
        "email" : "tdtayranoo@gmail.com",
        "customer_name" : email_detail.get('first_name'),
        "order_id" : email_detail.get('id'),
        "game" : email_detail.get('name'),
        "price" : email_detail.get('price')

    }
    email = SendEmail(**data)
    await send_email(email,background_tasks)
    



    
    
    return ResponseTemplateConstructor(200,'OK','Confirm Successfully', None)

    
@router.get('/admin_owner/notification', response_class = EventSourceResponse)
async def ordered_notification(request: Request,db: DbSession, redis_client: Annotated[redis.Redis, Depends(get_redis)], current_user : Annotated[str,Depends(RequirePermission(['admin','owner']))]) -> AsyncIterable[ServerSentEvent]:
    
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(new_order_channel)
    yield ServerSentEvent(event='start_connection',data='ping')
    
    

    try:
        while True:
            if await request.is_disconnected():
                break

            message = await pubsub.get_message(ignore_subscribe_messages=False, timeout=0.1)
            

            if message and message['type'] == "message" :
                data = json.loads(message['data'])
                if data['type'] == 'confirm_order':
                    message = {'order_id': data['order_id'], 'is_success': True}
                    yield ServerSentEvent(data=message, retry=5000, event=f'confirm_order:order_id:')
                result = await crud_order.get_new_order(db=db,user_id=data['user_id'],game_id=data['game_id'])
                customer = result['username']
                game_name = result['name']
                price = result['price']
                time = result['date']

                message = {'customer':customer,'game': game_name,'price':price,'time':time}
                yield ServerSentEvent(data=message,retry=5000,event='new_order')

            
    finally:
        await pubsub.unsubscribe(new_order_channel)
        await pubsub.close()

@router.get('/customer/notification', response_class=EventSourceResponse)
async def order_confirm_successfully(db: DbSession, request: Request, redis_client : Annotated[redis.Redis, Depends(get_redis)], token : Annotated[str, Depends(get_user)]) -> AsyncIterable[ServerSentEvent]:
    '''
    for user subscript
    '''

    pubsub = redis_client.pubsub()

    user_id = token.get('user_id')
    channel = f'{confirm_ordered}:user_id:{user_id}'
    await pubsub.subscribe(channel)

    yield ServerSentEvent(event='start_connection',data='ping')

    try:
        while True:

            message = await pubsub.get_message(ignore_subscribe_messages=False,timeout=0.1)
    
            if message and message['type'] == 'message':
                data = json.loads(message['data'])
                order_id = data['order_id']
                result = await crud_order.get_confirm_order(db=db,order_id=order_id)
                
                if result is None:
                    print('=' *100)
                    print(f"Order {result} not found in DB, skipping...")
                    print('=' *100)
                    continue
                print('=' *50)
                print('Result for popup user')
                print(result)
                print('=' *50)

                message = {'game':result['name']}
                user_id=result['user_id']
                yield ServerSentEvent(data=message, retry=5000,event=f'confirm_order:user_id:')

                 
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()


    
   