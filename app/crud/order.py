from sqlmodel import Session,text
from fastapi import HTTPException


async def get_order(db:Session):
    sql_query = text(
        'SELECT o.id AS "order_id", u.first_name, u.last_name, o.date, g.name AS "game_name" FROM "order" o ' \
        'JOIN game g ON o.game_id = g.id ' \
        'JOIN "user" u ON o.user_id = u.id')
    results = db.exec(sql_query).mappings().all()
    print("\n===========================================\n")
    print(results)
    print("\n===========================================\n")
    if not results:
        raise HTTPException(status_code=404,detail="ไม่พบรายการที่ค้นหา")

    return results
