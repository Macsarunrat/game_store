from sqlmodel import Session, text
import os
from fastapi import HTTPException



async def get_all_game(db: Session):
    sql_query = text('SELECT g.id as "game_id", g.name, g.description, g.price, c.name as "catagory" ' \
    'FROM game g JOIN game_catagory gc ON g.id = gc.game_id ' \
    'JOIN catagory c ON gc.catagory_id = c.id ' \
    'WHERE g.is_delete = False ' )
    results = db.exec(sql_query).mappings().all()
    group_catagory = {}
    for item in results:
        game_id = item['game_id']

        if game_id not in group_catagory:
            game_data = dict(item).copy()
            game_data['catagories'] = [game_data.pop('catagory')]
            # group_catagory[game_id] = game_data

            image_results = await get_images(db,game_id)
            print("Image=====================================")
            print(image_results)
            print("=====================================")
            game_data['images'] = []
            for i in image_results:
                game_data['images'].append({'image_id':i['id'],'image': os.path.basename(i['image']),'is_main':i['is_main']})
            group_catagory[game_id] = game_data
            print("GGGGGGGG=====================")
            print(group_catagory)
            print("\n\n\n")

        else :
            catagory = item['catagory']
            if catagory not in group_catagory[game_id]['catagories']:
                group_catagory[game_id]['catagories'].append(catagory)
    final_result = list(group_catagory.values())



    catagory = await get_catagory(db=db)
   

    results_dict = {
        'game_list' : final_result,
        'catagories_list' : catagory
    }
    
    print("results_dict====================================================")
    print(results_dict)
    print("====================================================")

    print("LIST====================================================")
    print(final_result)
    print("====================================================")
    print(results)
    print("====================================================")
    print("Catagory_dict====================================================")
    print(catagory )
    print("====================================================")
   

    
    return results_dict


async def get_catagory(db: Session):
    get_catagory_query = text('SELECT id AS "catagory_id", name AS "catagory_name" FROM catagory')
    results = db.exec(get_catagory_query).mappings().all()
    return results

async def get_images(db: Session,game_id):
    sql_query = text('SELECT id ,image, is_main FROM image WHERE game_id= :id')
    results = db.exec(sql_query,params={'id':game_id}).mappings().all()
    return results

async def create_game(db: Session, game_name: str, description: str, price : int , catagory: list[str]):
    try:
        insert_game_query = text(
            'INSERT INTO game (name,description,price) ' \
            'VALUES (:name,:description,:price)' \
            'RETURNING id'
            )
        result_game_id = db.exec(insert_game_query,params={
            'name': game_name,
            'description': description,
            'price': price,
        }).scalars().first()


        for i in catagory:
            insert_game_catagory_query = text(
                'INSERT INTO game_catagory (game_id,catagory_id) ' \
                'VALUES (:game_id,:catagory_id)')
            db.exec(insert_game_catagory_query,params={
                'game_id':int(result_game_id),
                'catagory_id': i})
        db.commit()
    except:
        db.rollback()
        return "เกิดข้อผิดพลาด"

    return result_game_id



async def delete_game(db: Session, game_id : list[int]):
    game_list = game_id
    sql_query = text('UPDATE game SET is_delete = True WHERE id = :id')
    for id in game_list:
        results = db.exec(sql_query,params={'id':id})
        if results.rowcount == 0:
            raise HTTPException(status_code=400,detail=f"ไม่พบเกมนี้ game_id:{id}")
    db.commit()
    return {"message": "succcess"}



async def update_game(db: Session,game_name: str | None, description :str | None, price : int | None, catagory: list | None, game_id: int ):

    request_body = {}

    if game_name is not None: request_body['name'] = game_name
    if description is not None: request_body['description'] = description
    if price is not None : request_body['price'] = price


    print(f'+++++++++++++++++++++++{request_body}+++++++++++++++++++++++')

    sql_column = ', '.join([f'{key} = :{key}' for key in request_body.keys()])
    print(f'+++++++++++++++++++++++{sql_column}+++++++++++++++++++++++')

    sql_query = text(f'UPDATE game SET {sql_column} WHERE id = :id')

    db.exec(sql_query,params={'name': game_name,'description': description,'price': price,'id':game_id})

    if catagory is not None :
        delete_previous_catagory = text('DELETE FROM game_catagory WHERE game_id = :id')
        db.exec(delete_previous_catagory,params={'id':game_id})

        create_game_catagory = text('INSERT INTO game_catagory (game_id,catagory_id)VALUES (:game_id, :catagory_id) ')
        for catagory_id in catagory:
            db.exec(create_game_catagory,params={'game_id':game_id,'catagory_id': catagory_id})
        


    db.commit()
    return {"message": "success"}