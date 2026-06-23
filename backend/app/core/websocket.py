import asyncio
from multiprocessing import managers
import webbrowser
import json

from dns.asyncquery import receive_udp
from fastapi import WebSocket,WebSocketException
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from pydantic.config import JsonEncoder
from app.utils.channel import global_event
import redis.asyncio as redis



class ConnectionManager():
    def __init__(self):
        self.active_user : dict[int, WebSocket] = {}

    async def connect(self,websocket: WebSocket, user_id : int):
        self.active_user[user_id] = websocket
        

    def disconnect(self, user_id):
        if user_id in self.active_user:
            del self.active_user[user_id]

    
    async def send_to_user(self,receiver_id: int, payload : dict):
        websocket = self.active_user.get(receiver_id)
        if websocket :
            await websocket.send_json(payload)
        else:
            pass
        

manager = ConnectionManager()



async def global_event_listener(redis_client : redis.Redis):
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(global_event)
    print('\n\n\n')
    print('เข้ามาที่ GLOBAL_EVENT')

    try:
        async for message in pubsub.listen():
            if message and message['type'] == 'message':
                raw_data = message.get('data')

                print('='*200)
                print('AT GLOBAL LISTENER')
                print(message)


                try:
                    data = json.loads(raw_data)

                    await manager.send_to_user(
                        receiver_id= data.get('receiver_id'),
                        payload=data
                    )
                except Exception as e:
                    print(f'Error at global listener : {e}')
    except asyncio.CancelledError:
        print('Close Global Listener')
        

    