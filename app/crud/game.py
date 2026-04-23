from sqlmodel import Session, text



async def get_all_game(db: Session):
    sql_query = text('SELECT g.id as "game_id", g.name, g.description, g.price, c.name as "catagory" ' \
    'FROM game g JOIN game_catagory gc ON g.id = gc.game_id ' \
    'JOIN catagory c ON gc.catagory_id = c.id ')
    results = db.exec(sql_query).mappings().all()
    group_catagory = {}
    for item in results:
        game_id = item['game_id']

        if game_id not in group_catagory:
            game_data = dict(item).copy()
            game_data['catagories'] = [game_data.pop('catagory')]
            group_catagory[game_id] = game_data
        else :
            catagory = item['catagory']
            if catagory not in group_catagory[game_id]['catagories']:
                group_catagory[game_id]['catagories'].append(catagory)
    final_result = list(group_catagory.values())
    
    print("LIST====================================================")
    print(final_result)
    print("====================================================")
    print(results)
    print("====================================================")

    
    return final_result
