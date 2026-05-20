from sqlmodel import Session,text
import shutil
import os
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession



async def save_fimename(db:AsyncSession,filename:str,is_main: bool,game_id: int):
    if is_main == True:
        sql_query_delete_main_image = text('DELETE FROM image WHERE game_id=:game_id AND is_main= True')
        await db.exec(sql_query_delete_main_image,params={'game_id':game_id})

    sql_query = text('INSERT INTO image (image,is_main,game_id) ' \
    'VALUES (:image,:is_main,:game_id) RETURNING id')

    result = (await db.exec(sql_query,params={'image':filename,'is_main':is_main,'game_id':game_id})).scalar()
    await db.commit()
    print(result)
    return result


async def test_get_image(db: AsyncSession):

    sql_query = text('SELECT * FROM image')
    results = await db.exec(sql_query).mappings().first()

    filename = results['image']
    print("==========================")
    print(filename)
    print("==========================")
    with open(filename,"rb") as image_file:
        image = os.path.basename(filename)

    print(image)
    return image


async def delete_image(db: AsyncSession,image_id : list[int]):

    #Delete from folder
    fetch_query = text('SELECT id,image FROM image WHERE id IN :id')
    results = await db.exec(fetch_query, params={'id': tuple(image_id)}).mappings().all()

    if not results:
        raise HTTPException(status_code=400,detail='Not found Image')
    
    

    for row in results:
        file_path = f"{row['image']}"
        print('='*100)
        print("File Path")
        print(file_path)
        print('='*100)
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


    #Delete from database
    sql_query = text('DELETE FROM image WHERE id IN :id')
    result = await db.exec(sql_query,params={'id': tuple(image_id)})
    if result.rowcount == 0:
        raise HTTPException(status_code=400,detail='Not found Image')
    await db.commit()
