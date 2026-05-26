from sentry_sdk.transport import Http2Transport
from sqlmodel import Session, text
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession


async def get_all_user(db: AsyncSession, name : str | None, user_id : int):

    lasted_message_subquery = """
            LEFT JOIN (
            SELECT friendship_id ,message, created_at, sender_id
            FROM (
                SELECT friendship_id , message , created_at, sender_id, 
                    ROW_NUMBER() OVER (PARTITION BY friendship_id ORDER BY created_at DESC) as rn
                FROM chat_history
            ) sub
            WHERE sub.rn = 1
            ) ch ON ch.friendship_id = f.id

    """

    base_sql = f"""
            SELECT u.id,u.first_name, u.last_name, f.status,f.requester_id , ch.message AS lasted_message, ch.created_at AS created_at, ch.sender_id AS latest_id
            FROM "user" u 
            LEFT JOIN friends f ON 
            (f.friend_id = u.id AND f.user_id = :user_id ) OR 
            (f.user_id = u.id AND f.friend_id = :user_id) 
            {lasted_message_subquery}

    """

    if not name:
        sql_query = text(base_sql + " WHERE u.id != :user_id LIMIT 50")
        params ={'user_id':user_id}
    else :
        sql_query = text(base_sql + " WHERE (u.first_name LIKE :name OR u.last_name LIKE :name) AND u.id != :user_id LIMIT 50")
        params = {'name': f'%{name}%', 'user_id':user_id}
    
    results = (await db.exec(sql_query,params=params)).mappings().all()
    print(results)

    return results

    


async def get_friends_of_user(db: AsyncSession, user_id: int):
    """
    ยังไม่ต้องใช้
    """
    sql_query = text('' \
    'SELECT u.id, u.first_name, u.last_name FROM "user" u ' \
    'JOIN friends f ON f.friend_id = u.id ' \
    'WHERE f.user_id = :user_id ')

    results = await db.exec(sql_query,params={'user_id': user_id}).mappings().all()
    return results


async def add_friend(db : AsyncSession , user_id: int , friend_id : int):
    try:
        requester_id = user_id


        smaller_id, larger_id = (user_id, friend_id) if user_id < friend_id else (friend_id,user_id)

        insert_query = text(' ' \
        'INSERT INTO FRIENDS (user_id,friend_id, requester_id,status) ' \
        'VALUES (:user_id,:friend_id,:requester_id,:status) ')
        await db.exec(insert_query, params={'user_id':smaller_id,'friend_id': larger_id,'requester_id':requester_id, 'status': 'pending'})

        requester_query = text("""

            SELECT first_name , last_name FROM "user" WHERE id = :requester_id
            """)
        result = (await db.exec(requester_query,params={'requester_id':requester_id})).mappings().first()

        await db.commit()
        return result
    except IntegrityError :
        raise HTTPException(status_code=400, detail='ไม่สามารถเพิ่มเพื่อนที่มีอยู่แล้วได้')



async def save_chat(db: AsyncSession, user_id : int, friendship_id : int, message : str,created_at : datetime):
    sql_query = text(
        ' INSERT INTO chat_history (sender_id, friendship_id, message,created_at) ' \
        'VALUES (:sender_id,:friendship_id,:message,:created_at) '
    )
    await db.exec(sql_query,params={'sender_id':user_id,'friendship_id': friendship_id,'message':message,'created_at': created_at})
    await db.commit()


async def is_friend(db: AsyncSession, user_id: int , friend_id: int):

    

    smaller_id, larger_id = (user_id, friend_id) if user_id < friend_id else (friend_id,user_id)
    
    sql_query = text(
        'SELECT f.id FROM friends f ' \
        'WHERE f.user_id = :user_id AND f.friend_id = :friend_id'
    )
    results = (await db.exec(sql_query,params={'user_id':smaller_id,'friend_id':larger_id})).mappings().first()
    print("ผลลัพธ์จากการค้นหาเพื่อน")
    print(results)
    if results == None:
        return None
    return results


async def get_history(db: AsyncSession, friendship_id : int):
    sql_query = text(
        'SELECT * FROM chat_history ch ' \
        'WHERE ch.friendship_id = :friendship_id ' \
        'ORDER BY ch.created_at ASC'
    )
    results = (await db.exec(sql_query,params={'friendship_id': friendship_id})).mappings().all()
    return results


async def confirm_friend(db: AsyncSession,user_id: int, friend_id : int):
    try:
        lower_id = min(user_id,friend_id)
        higher_id = max(user_id,friend_id)

        sql_query = text(
            "UPDATE friends set status = 'friend' " \
            "WHERE user_id = :user_id AND friend_id = :friend_id AND status != 'friend'"
        )
        result = await db.exec(sql_query,params={'user_id':lower_id,'friend_id':higher_id})
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail=f'You are already friends or no pending request found.'
            )
    except Exception as e:
        raise HTTPException(status_code=400,detail=f'Error : {e}')