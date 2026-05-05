from sqlmodel import text, Session
from fastapi import HTTPException


async def login(db: Session, username, password, jti: str):
    try :
        sql_query = text(
            'SELECT u.id,u.username, u.password, u.role_id,u.first_name,u.last_name, role.name AS "role_name", u.id AS "user_id" FROM "user" u JOIN role ON u.role_id = role.id ' \
            'WHERE u.username= :username and u.password= :password' \
            ' '
            )
        results = db.exec(sql_query,params={'username':username,'password': password}).mappings().first()

        

        if results:
            results = dict(results)
            await save_jti(db=db,user_id=results['id'], jti=str(jti))
            print(f"\n\n==========================\njti is {jti}")
            print(f'\n{results['id']}')
            print("==========================================")
            print(results)
            print("==========================================")
            
            return results
        

        
        
    except Exception as e:
        db.rollback()
        raise e
    return None

async def save_jti(db: Session, user_id:int , jti : str):
    try:
        save_jti_query = text(
                'INSERT INTO user_refresh_token (user_id,jti,is_active) VALUES (:user_id ,:jti,True)')
        db.exec(save_jti_query,params={'user_id':user_id,'jti':jti})
        print("บันทึก  jti สำเร็จ")
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=401,detail=f"ไม่สามารถบันทึกลง jti Error {e}")


async def authenticate_user(db: Session,username: str):
    sql_query = text('SELECT username FROM "user" WHERE username= :username')
    username = db.exec(sql_query,params={'username': username}).mappings().first()
    if not username:
        return None
    return username



async def get_role_and_permission(db: Session, username: str):
    sql_query = text(
        'SELECT p.name as "permission" FROM "user" u ' \
        'JOIN role ON u.role_id = role.id ' \
        'JOIN permission p ON role.id = p.role_id ' \
        'WHERE u.username = :username'
    )
    results = db.exec(sql_query,params={'username':username}).scalars().all()
    print(results)
    return results


async def check_jti(db: Session,jti: str):
    sql_query = text('SELECT * FROM user_refresh_token WHERE jti = :jti')
    result = db.exec(sql_query,params={'jti':jti}).mappings().first()
    print("\n\n\nResult jti")
    print(result)
    return result

async def logout(db: Session , jti: str):
    try:
        sql_query = text('UPDATE user_refresh_token SET is_active = False WHERE jti= :jti')
        db.exec(sql_query,params={'jti': jti})
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    

async def check_owner_refresh_key(db: Session, jti : str):
    sql_query = text(
        'SELECT u.id,u.username, r.name as "role_name" , urt.is_active FROM "user" u ' \
        'JOIN user_refresh_token urt ON u.id = urt.user_id ' \
        'JOIN role r ON u.role_id = r.id ' \
        'WHERE urt.jti = :jti')
    results = db.exec(sql_query, params={'jti':jti}).mappings().first()
    return results
