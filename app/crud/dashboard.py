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

    results = {
        'total_income' : total_income,
        'best_seller_game' : best_seller_game[0].get('name'),
        'total_order' : total_order
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
		'GROUP BY c.name '
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