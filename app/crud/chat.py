from sqlmodel import Session, text
from fastapi import HTTPException


async def get_all_user(db: Session, name : str | None, user_id : int):

    if not name:
        sql_query = text(
            'SELECT u.id,u.first_name, u.last_name, f.status FROM "user" u ' \
            'LEFT JOIN friends f ON f.friend_id = u.id AND f.user_id = :user_id ' \
            'WHERE u.id != :user_id ' \
            'LIMIT 20 '
            )
        results =db.exec(sql_query,params={'user_id':user_id}).mappings().all()
    else :
        sql_query = text(
            'SELECT u.id,u.first_name, u.last_name FROM "user" u ' \
            'LEFT JOIN friends f ON f.friend_id = u.id AND f.user_id = :user_id ' \
            'WHERE u.first_name LIKE :name OR u.last_name LIKE :name AND u.id != :user_id ' \
            'LIMIT 20'
            )
        results = db.exec(sql_query,params={'name': f'%{name}%', 'user_id':user_id}).mappings().all()

    return results

    


async def get_friends_of_user(db: Session, user_id: int):
    """
    ยังไม่ต้องใช้
    """
    sql_query = text('' \
    'SELECT u.id, u.first_name, u.last_name FROM "user" u ' \
    'JOIN friends f ON f.friend_id = u.id ' \
    'WHERE f.user_id = :user_id ')

    results = db.exec(sql_query,params={'user_id': user_id}).mappings().all()
    return results


async def add_friend(db : Session , user_id: int , friend_id : int):

    requester_id = user_id


    smaller_id, larger_id = (user_id, friend_id) if user_id < friend_id else (friend_id,user_id)

    sql_query = text(' ' \
    'INSERT INTO FRIENDS (user_id,friend_id, requester_id,status) ' \
    'VALUES (:user_id,:friend_id,:requester_id,:status) ')
    db.exec(sql_query, params={'user_id':smaller_id,'friend_id': larger_id,'requester_id':requester_id, 'status': 'pending'})
    db.commit()


async def save_chat(db: Session, user_id : int, friendship_id : int, message : str):
    sql_query = text(
        ' INSERT INTO chat_history (sender_id, friendship_id, message) ' \
        'VALUES (:sender_id,:friendship_id,:message) '
    )
    db.exec(sql_query,params={'sender_id':user_id,'friendship_id': friendship_id,'message':message})
    db.commit()


async def is_friend(db: Session, user_id: int , friend_id: int):

    

    smaller_id, larger_id = (user_id, friend_id) if user_id < friend_id else (friend_id,user_id)
    
    sql_query = text(
        'SELECT f.id FROM friends f ' \
        'WHERE f.user_id = :user_id AND f.friend_id = :friend_id'
    )
    results = db.exec(sql_query,params={'user_id':smaller_id,'friend_id':larger_id}).mappings().first()
    print("ผลลัพธ์จากการค้นหาเพื่อน")
    print(results)
    if results == None:
        return None
    return results


async def get_history(db: Session, friendship_id : int):
    sql_query = text(
        'SELECT * FROM chat_history ch ' \
        'WHERE ch.friendship_id = :friendship_id ' \
        'ORDER BY ch.created_at ASC'
    )
    results = db.exec(sql_query,params={'friendship_id': friendship_id}).mappings().all()
    return results
