from datetime import date
from string import ascii_uppercase

from sqlmodel import Session,text
from sqlmodel.ext.asyncio.session import AsyncSession


async def get_header(db: AsyncSession):
    total_income_query = text(
        'SELECT SUM(g.price) FROM "order" o ' \
        'JOIN game g on o.game_id = g.id ' \
        'WHERE o.is_success = true'
    )
    total_income = (await db.exec(total_income_query)).scalar()

    best_seller_game_query = text(
        'SELECT g.name , SUM(o.id) FROM "order" o ' \
        'JOIN game g ON o.game_id = g.id ' \
        'WHERE o.is_success = true ' \
        'GROUP BY g.name ' \
        'ORDER BY sum DESC ' \
        'LIMIT 1'
    )

    best_seller_game =(await db.exec(best_seller_game_query)).mappings().all()

    total_order_query = text(
        'SELECT COUNT(id) FROM "order" ' \
        'WHERE is_success = true'
    )
    total_order = (await db.exec(total_order_query)).scalar()

    active_user_a_day_query = text(
        """
        SELECT COUNT(id) FROM user_refresh_token
        WHERE is_active = true AND DATE(create_at) >= CURRENT_DATE;
        """
    )
    active_user_a_day = (await db.exec(active_user_a_day_query)).scalar()

    results = {
        'total_income' : total_income or 0,
        'best_seller_game' : best_seller_game[0].get('name') if best_seller_game else None,
        'total_order' : total_order or 0,
        'active_user_a_day': active_user_a_day or 0
    }
    print(results)
    return results



async def get_chart_donut(db : AsyncSession):
    percent = 100
    total_income = 0

    sql_query = text(
        'SELECT c.name AS "category_name",SUM(g.price) as "income" FROM catagory c ' \
        'LEFT JOIN game_catagory gc ON c.id = gc.catagory_id '
        'LEFT JOIN "order" o ON o.game_id = gc.game_id AND o.is_success = true '
		'LEFT JOIN game g ON o.game_id = g.id ' \
		'GROUP BY c.name ' \
        'ORDER BY income DESC'
    )

    results = (await db.exec(sql_query)).mappings().all()

    print('DONUT')
    print('='*150)
    print(results)
    data = [dict(row) for row in results]
    print('DATA')
    print('='*150)
    print(data)

    new_data = []
    
    for row in data:
        if row.get('income') == None:
            row['income'] = 0
        if row.get('category_name') == "Free":
            continue
        new_data.append(row)

    print('AFTER 0')
    print(new_data)

    total_income += sum(row['income'] for row in data)

    print('AFTER format')
    print(new_data)

    data_percent = []
    for row in new_data:
        row['avg'] = f"{row['income'] *100 / total_income:.2f}"
        data_percent.append(row) 
    print('After percent')
    print(data_percent)
    

    return data_percent


async def get_bar_chart(db: AsyncSession):
    sql_query = text(
        'SELECT u.username AS "username", SUM(g.price) AS "total_spending" FROM "user" u ' \
        'JOIN "order" o ON o.user_id = u.id ' \
        'LEFT JOIN game g ON o.game_id = g.id ' \
        'WHERE o.is_success = true ' \
        'GROUP BY u.username ' \
        'ORDER BY total_spending DESC ' \
        'LIMIT 5'
    )

    results = (await db.exec(sql_query)).mappings().all()

    return results


async def get_trend_line_chart(db: AsyncSession,start_date: date,end_date:date, step: str, date_format: str):

    print("====== ข้อมูลที่จะส่งเข้า Database ======")
    print(f"Start Date: {repr(start_date)}") 
    print(f"End Date: {repr(end_date)}")
    print("========================================")
    

    sql_query_1_year = text(
        f"""
        SELECT TO_CHAR(series.day AT TIME ZONE 'Asia/Bangkok', :date_format) as "date",
        COALESCE(SUM(g.price),0) as income

        FROM
        generate_series(CAST(:start_date AS TIMESTAMPTZ),CAST(:end_date AS TIMESTAMPTZ), CAST(:step AS INTERVAL)) as series(day)
        LEFT JOIN "order" o 
            ON o.date >= series.day 
            AND o.date < (series.day + CAST(:step AS INTERVAL)) 
        LEFT JOIN game g ON o.game_id = g.id
        GROUP BY series.day
        ORDER BY series.day ASC


        """
    )

    trend_line =(await db.exec(sql_query_1_year,params={'start_date':start_date,'end_date':end_date,'step':step,'date_format':date_format})).mappings().all()
    return trend_line


async def get_v2_donut_chart(db: AsyncSession, category_id : int, start_date: date, end_date: date):

    print("====== ข้อมูลที่จะส่งเข้า Database ======")
    print(start_date)
    print(end_date)
    sql_query = text(
        """
        SELECT g.name AS game_name, COUNT(o.id) AS count_order ,c.name FROM "order" o 
        LEFT JOIN game g ON o.game_id = g.id
        LEFT JOIN game_catagory gc ON g.id = gc.game_id
        LEFT JOIN catagory c ON  gc.catagory_id =c.id 
        WHERE c.id = :category AND o.is_success = true AND o.date >= CAST(:start_date AS TIMESTAMP) AND o.date < CAST(:end_date AS TIMESTAMP)
        GROUP BY g.name , c.name

        """
    )
    results = (await db.exec(sql_query,params={'category': category_id,'start_date': start_date,'end_date': end_date})).mappings().all()

    data = [dict(row) for row in results]
    catagory_name = data[0].pop('name') if data else None

    response_data = {
        'category_name' : catagory_name,
        'game_list': data
    }


    return response_data
    