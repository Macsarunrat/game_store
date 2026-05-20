from ....core.websocket import ConnectionManager
from fastapi import APIRouter, Depends, status, HTTPException, WebSocket, WebSocketDisconnect,status,Depends
from ....core.authentication import decode_jwt
from ....dependencies import DbSession,get_user
from ....crud import chat as crud_chat
from ....schema.chat import Friend,All_Friend
from typing import Annotated
from ....schema.template import ResponseTemplate, ResponseTemplateConstructor
from datetime import datetime
from fastapi.encoders import jsonable_encoder

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
                created_at = datetime.now()
                

                #check if both of you are friend before send message
                friendship_id = await crud_chat.is_friend(db=db,user_id=user_id,friend_id=receiver_id)
                if not friendship_id:
                    await websocket.send_json({'Error': 'You are not friends'})
                    continue

                

                await crud_chat.save_chat(db=db,user_id=user_id,friendship_id=friendship_id.get('id'),message=message,created_at=created_at)

                await manager.send_to_user(message=message, receiver_id=receiver_id,time=created_at,sender_id=user_id)


            except Exception as e:
                print(f"⚠️ เกิดข้อผิดพลาดระหว่างแชท: {e}")
                await websocket.send_json({"error": f"ระบบเซิร์ฟเวอร์ขัดข้องในการส่งข้อความ {e}"})

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

@router.get('/me/friends', response_model=ResponseTemplate[list[All_Friend]])
async def get_all_user(db: DbSession, user_data : Annotated[str,Depends(get_user)], name : str | None = None):
    user_id = user_data['user_id']
    results = await crud_chat.get_all_user(db,name,user_id)
    json_data = jsonable_encoder(results)
    return ResponseTemplateConstructor(200,'OK','Friend', json_data)




@router.post('/add/new-friend', response_model=ResponseTemplate[str])
async def add_new_friend(db: DbSession, body : Friend,current_user : Annotated[str,Depends(get_user)]):
    user_id = current_user.get('user_id')
    friend_id = body.friend_id
    await crud_chat.add_friend(db,user_id,friend_id)
    return ResponseTemplateConstructor('200','OK','Add new friend successfully', None)


@router.post('/confirm/friend' , response_model=ResponseTemplate[str])
async def confirm_friend(db: DbSession , body : Friend, current_user : Annotated[str, Depends(get_user)]):
    user_id = current_user.get('user_id')
    friend_id = body.friend_id

    await crud_chat.confirm_friend(db,user_id,friend_id)
    
    return ResponseTemplateConstructor('200','OK','Confirm adding friend successfully',None)





@router.get('/history/{receiver_id}', response_model=ResponseTemplate[list])
async def get_history(db: DbSession, receiver_id : int, user_data: Annotated[str,Depends(get_user)]):

    user_id = user_data['user_id']
    print('=' * 50)
    print(user_id)
    print('=' * 50)

    friendship_id = await crud_chat.is_friend(db=db,user_id=user_id,friend_id=receiver_id)
    friendship_id = friendship_id['id']
    chat_history = await crud_chat.get_history(db=db,friendship_id=friendship_id)
    json_data = jsonable_encoder(chat_history)
    return ResponseTemplateConstructor('200','OK','Fetch chat history',json_data)