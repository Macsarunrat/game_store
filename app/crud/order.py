from sqlmodel import Session,text
from fastapi import HTTPException
import os


async def get_order(db:Session):
    sql_query = text(
        'SELECT o.id AS "order_id", u.first_name, u.last_name, o.date, g.name AS "game_name", img.image as "image",g.price,o.date, u.id AS "user_id" , g.id as "game_id", o.is_success FROM "order" o ' \
        'JOIN game g ON o.game_id = g.id ' \
        'JOIN "user" u ON o.user_id = u.id ' \
        'JOIN image img on img.game_id = g.id ' \
        'WHERE img.is_main = true ' \
        'ORDER BY o.id DESC')
    results = db.exec(sql_query).mappings().all()

    print("\nOrder Results===========================================\n")
    print(results)
    print("\n===========================================\n")
    if not results:
        raise HTTPException(status_code=404,detail="ไม่พบรายการที่ค้นหา")

    return [{**dict(item), "image": os.path.basename(item['image'])} for item in results]


async def update_status(db: Session,order_id : int):
    try : 
        sql_query = text(
            'UPDATE "order" SET is_success = true WHERE id = :order_id'
        )
        db.exec(sql_query,params={'order_id':order_id})
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"ไม่สามารถยืนยันรายการได้ {e}")
