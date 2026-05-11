from fastapi import WebSocket,WebSocketException



class ConnectionManager():
    def __init__(self):
        self.active_user : dict[int, WebSocket] = {}

    async def connect(self,websocket: WebSocket, user_id : int):
        self.active_user[user_id] = websocket
        

    def disconnect(self, user_id):
        if user_id in self.active_user:
            del self.active_user[user_id]

    
    async def send_to_user(self, message : str, receiver_id):
        websocket = self.active_user.get(receiver_id)
        if websocket :
            await websocket.send_text(message)
        else:
            pass
        
        

        