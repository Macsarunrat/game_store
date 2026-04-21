from sqlmodel import text, Session




async def login(db: Session, username, password):
    sql_query = text(
        'SELECT * FROM "user" WHERE username= :username and password= :password'
        )
    results = db.exec(sql_query,params={'username':username,'password': password}).first()
    if results:
        return dict(results._mapping)
    return None
