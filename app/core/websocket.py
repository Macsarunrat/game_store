from fastapi import WebSocket,WebSocketException
from datetime import datetime
from fastapi.encoders import jsonable_encoder



class ConnectionManager():
    def __init__(self):
        self.active_user : dict[int, WebSocket] = {}

    async def connect(self,websocket: WebSocket, user_id : int):
        self.active_user[user_id] = websocket
        

    def disconnect(self, user_id):
        if user_id in self.active_user:
            del self.active_user[user_id]

    
    async def send_to_user(self, message : str, receiver_id: int, time : datetime,sender_id : int):
        websocket = self.active_user.get(receiver_id)
        if websocket :
            data = jsonable_encoder({
                'message' : message,
                'time' : time,
                'sender_id': sender_id
                
            })
            
            await websocket.send_json(data)
        else:
            pass
        
        

        