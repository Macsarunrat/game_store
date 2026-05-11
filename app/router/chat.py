from ..core.websocket import ConnectionManager
from fastapi import APIRouter, Depends, status, HTTPException, WebSocket, WebSocketDisconnect,status,Depends
from ..core.authentication import decode_jwt
from ..dependencies import DbSession,get_user
from ..crud import chat as crud_chat
from ..schema.chat import AddFriend
from typing import Annotated
from ..schema.template import ResponseTemplate, ResponseTemplateConstructor

router = APIRouter(
    prefix='/chat',
    tags=['chat']
)


manager = ConnectionManager()
@router.websocket('/ws/me')
async def websocket_endpoint(websocket : WebSocket, db: DbSession):
    print("\n\n\n\n")
    print(f"🔥 มีคนพยายามเชื่อมต่อเข้ามา!")
    try:
        await websocket.accept()
        

        first_msg = await websocket.receive_json()
        user_data = decode_jwt(token=first_msg.get('access_token'))

        if first_msg.get('type') != 'auth' or not user_data:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION,reason="Token ไม่พบ หรือไม่ถูกต้อง")
            return

        user_id = user_data['user_id']
        print("คนที่เข้ามา")
        print(user_id)

        await manager.connect(websocket,user_id)
            
        while True:
            try:
                data = await websocket.receive_json()


                # for keeping connection
                if data.get('type') == 'ping':
                    await websocket.send_json({'type':'pong'})
                    continue


                receiver_id = data['receiver_id']
                message = data['message']

                #check if both of you are friend before send message
                friendship_id = await crud_chat.is_friend(db=db,user_id=user_id,friend_id=receiver_id)
                if not friendship_id:
                    await websocket.send_json({'Error': 'You are not friends'})
                    continue

                await crud_chat.save_chat(db=db,user_id=user_id,friendship_id=friendship_id.get('id'),message=message)

                await manager.send_to_user(message=message, receiver_id=receiver_id)


            except Exception as e:
                print(f"⚠️ เกิดข้อผิดพลาดระหว่างแชท: {e}")
                await websocket.send_json({"error": "ระบบเซิร์ฟเวอร์ขัดข้องในการส่งข้อความ"})

    except WebSocketDisconnect:
        manager.disconnect(user_id=user_id)


@router.get('/chat/excample')
async def example():
    """
    ยิงมาที่เส้น ws://192.168.1.63:8000/api/v1/chat/ws/me \n


    ครั้งแรกทำการ authentication ก่อนผ่าน
    {
        "type" : "auth",
        "access_token" : "{Token}"
    }

    ครั้งต่อๆมาทำการสื่อสารได้เลย
    {
        "receiver_id" : "ระบุผู้รับ",
        "message" : "ข้อความที่ส่งหากัน"
    }
    
    """
    return


@router.get('/get/friends')
async def get_friend_of_user(db: DbSession, user : Annotated[str,Depends(get_user)]):
    """
    ไม่ต้องใช้
    """
    user_id = user.get('user_id')
    results = crud_chat.get_friends_of_user(db,user_id)
    return results

@router.get('/me/friends')
async def get_all_user(db: DbSession, name : str | None, user_data : Annotated[str,Depends(get_user)]):
    user_id = user_data['user_id']
    results = await crud_chat.get_all_user(db,name,user_id)
    return results




@router.post('/add/new-friend', response_model=ResponseTemplate[str])
async def add_new_friend(db: DbSession, body : AddFriend):
    user_id = body.user_id
    friend_id = body.friend_id
    await crud_chat.add_friend(db,user_id,friend_id)
    return ResponseTemplateConstructor('200','OK','Add new friend successfully', None)






@router.get('/history/{receiver_id}')
async def get_history(db: DbSession, receiver_id : int, user_data: Annotated[str,Depends(get_user)]):

    user_id = user_data['user_id']
    print('=' * 50)
    print(user_id)
    print('=' * 50)

    friendship_id = await crud_chat.is_friend(db=db,user_id=user_id,friend_id=receiver_id)
    friendship_id = friendship_id['id']
    chat_history = await crud_chat.get_history(db=db,friendship_id=friendship_id)
    return chat_history