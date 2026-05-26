from pytest import param
from sqlmodel import Session,text
from fastapi import HTTPException
import os
from sqlmodel.ext.asyncio.session import AsyncSession

from app.model import order
from typing import Optional


async def get_order(db:AsyncSession):
    sql_query = text(
        'SELECT o.id AS "order_id", u.first_name, u.last_name, o.date, g.name AS "game_name", img.image as "image",g.price,o.date, u.id AS "user_id" , g.id as "game_id", o.is_success FROM "order" o ' \
        'JOIN game g ON o.game_id = g.id ' \
        'JOIN "user" u ON o.user_id = u.id ' \
        'JOIN image img on img.game_id = g.id ' \
        'WHERE img.is_main = true ' \
        'ORDER BY o.id DESC')
    results = (await db.exec(sql_query)).mappings().all()

    print("\nOrder Results===========================================\n")
    print(results)
    print("\n===========================================\n")
    if not results:
        raise HTTPException(status_code=404,detail="ไม่พบรายการที่ค้นหา")

    return [{**dict(item), "image": os.path.basename(item['image'])} for item in results]


async def update_status(db: AsyncSession,order_id : int | None = None, stripe_session_id : str | None = None):
    try :
        # #check if customer has already paid 
        # check_paid_query = text("""
        #     SELECT id FROM "order" WHERE id = :order_id AND is_success = true
        # """)
        # result = await db.exec(check_paid_query,params={'order_id':order_id})

        # already_paid_record = result.first()

        # if already_paid_record:
        #     return "You've already paid this game"
            


        params = {'order_id':int(order_id)}
        stripe_query = ""

        if stripe_session_id:
            stripe_query = ", stripe_session_id = :stripe_session_id"
            params = {'order_id':order_id,'stripe_session_id': stripe_session_id}

        sql_query = text(
            f'UPDATE "order" SET is_success = true {stripe_query}  WHERE id = :order_id ' \
            'RETURNING user_id'
        )
        result = (await db.exec(sql_query,params=params)).mappings().first()
        await db.commit()
        return result
    except Exception as e:
        await db.rollback()
        print(f'Error {e}')
        raise HTTPException(status_code=400,detail=f"ไม่สามารถยืนยันรายการได้ {e}")


async def get_new_order(db: AsyncSession, user_id:int ,game_id: int):
    sql_query = text(
        'SELECT o.date,u.username,g.name, g.price FROM "order" o ' \
        'JOIN "user" u ON u.id= o.user_id ' \
        'JOIN game g ON g.id = o.game_id ' \
        'WHERE o.user_id = :user_id AND o.game_id=:game_id ')
    
    result = (await db.exec(sql_query,params={'user_id':user_id,'game_id':game_id})).mappings().first()

    return result

async def get_confirm_order(db:AsyncSession, order_id: int):
    sql_query = text(
        'SELECT g.name,o.user_id FROM "order" o ' \
        'JOIN game g ON g.id= o.game_id ' \
        'WHERE o.id = :order_id'
    )
    result = (await db.exec(sql_query,params={'order_id':order_id})).mappings().first()
    if result is None:
        return None
    return result


async def get_order_by_id(db :AsyncSession, order_id: int):
    sql_query = text(
        'SELECT u.first_name, o.id , g.name, g.price,g.description,u.email FROM "order" o ' \
        'JOIN "user" u ON o.user_id = u.id ' \
        'JOIN game g ON o.game_id = g.id ' \
        'WHERE o.id = :order_id'
    )

    results = (await db.exec(sql_query,params={'order_id':order_id})).mappings().first()

    return results 


async def check_owner_order(db: AsyncSession, order_id:int, user_id:int):
    sql_query = text(
        """
        SELECT * FROM "order" WHERE id=:order_id AND user_id=:user_id
        """
    )
    result = await db.exec(sql_query,params={'order_id':order_id,'user_id':user_id})
    order_data = result.mappings().first()
    if not order_data:
        raise HTTPException(status_code=400,detail='This order is not belong to you')
    return order_data