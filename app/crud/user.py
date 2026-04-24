from sqlmodel import text, Session




async def login(db: Session, username, password):
    sql_query = text(
        'SELECT u.id,u.username, u.password, u.role_id,u.first_name,u.last_name, role.name AS "role_name", u.id AS "user_id" FROM "user" u JOIN role ON u.role_id = role.id ' \
        'WHERE u.username= :username and u.password= :password' \
        ' '
        )
    results = db.exec(sql_query,params={'username':username,'password': password}).mappings().first()
    if results:
        results = dict(results)
        print("==========================================")
        print(results)
        print("==========================================")
        
        return results
    return None


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
