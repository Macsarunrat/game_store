
from sqlmodel import SQLModel, Session
from functools import wraps
from fastapi import Request, HTTPException
from sqlmodel import text
from datetime import datetime
from ..core.database import get_database_session
import json
from sqlmodel.ext.asyncio.session import AsyncSession



async def save_log(model : type[SQLModel],action_type : str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):

            result = await func(*args, **kwargs)

            db : AsyncSession = kwargs.get('db')

            if db :

                log_data = {'action_type': action_type}

                request : Request = kwargs.get('request')

                if request:
                    log_data['ip_address'] = request.headers.get("x-forwarded-for") or request.client.host
                else :
                    log_data['ip_address'] = 'UNKNOWN'
                
                if 'current_user' in kwargs:
                    log_data['user_id'] = kwargs.get('current_user')['user_id']

                if action_type == 'CREATE':
                    try :
                        if result.detail:
                            log_data['game_id'] = result.detail.get('ไอดีที่เพิ่ม') 
                        else:
                            log_data['game_id'] = kwargs.get('body').game_id
                        
                    except Exception as e:
                        print(f'Error {e}')

                else:            
                
                    valid_column = model.model_fields.keys()

                    target_list_key = None
                    target_list_values = []

                    for key, value in kwargs.items():
                        if key in valid_column:
                            if isinstance(value, list):
                                target_list_key = key
                                target_list_values = value
                            else:
                                log_data[key] = value
                
                try:
                    if target_list_key and target_list_values :
                        for value in target_list_values:
                            current_log_data = log_data.copy()
                            current_log_data[target_list_key] = value

                            new_log = model(**current_log_data)
                            await db.add(new_log)

                    else:

                        new_log = model(**log_data)
                        await db.add(new_log)
                    await db.commit() 
                except Exception as e:
                    print(f'Error {e}')

            return result
        return wrapper
    return decorator



async def game_log(user_id: int , game_id : int, action_type :str ,ip_address: str, payload : dict | None):

    with get_database_session() as db:
        try:
            if payload :
                sql_query = text(
                    'INSERT INTO game_logs (user_id,game_id,action_type,ip_address,time,payload) ' \
                    'VALUES (:user_id,:game_id,:action_type,:ip_address,:time,:payload) '
                )

                json_data = json.dumps(payload)

                await db.exec(sql_query, params={
                            'user_id': user_id,
                            'game_id' : game_id,
                            'action_type' : action_type,
                            'ip_address' : ip_address,
                            'time': datetime.now(),
                            'payload': json_data
                        })
            else:
                sql_query = text(
                    'INSERT INTO game_logs (user_id,game_id,action_type,ip_address,time) ' \
                    'VALUES (:user_id,:game_id,:action_type,:ip_address,:time) '
                )
                await db.exec(sql_query, params={
                            'user_id': user_id,
                            'game_id' : game_id,
                            'action_type' : action_type,
                            'ip_address' : ip_address,
                            'time': datetime.now(),
                        })

            
            db.commit()


        except Exception as e:
            await db.rollback()
            print('Game log Error {e}')



async def image_log(db: AsyncSession,user_id : int , image_id: int, action_type : str, ip_address: str):
    try: 
        sql_query = text(
            'INSERT INTO image_logs (user_id,image_id,action_type,ip_address,time) ' \
            'VALUES (:user_id,:image_id,:action_type,:ip_address,:time) '
        )

        if isinstance(image_id, list):
            for item in image_id:
                await db.exec(sql_query, params={
                    'user_id': user_id,
                    'image_id' : item,
                    'action_type' : action_type,
                    'ip_address' : ip_address,
                    'time': datetime.now()
                })
        else:
            await db.exec(sql_query, params={
                    'user_id': user_id,
                    'image_id' : image_id,
                    'action_type' : action_type,
                    'ip_address' : ip_address,
                    'time': datetime.now()
                })
        await db.commit()
    except Exception as e :
        raise HTTPException(status_code=400,detail=f'image log error {e}')


