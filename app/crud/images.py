from sqlmodel import Session,text
import shutil
import os
from fastapi import HTTPException



async def save_fimename(db:Session,filename:str,is_main: bool,game_id: int):
    sql_query = text('INSERT INTO image (image,is_main,game_id) ' \
    'VALUES (:image,:is_main,:game_id) RETURNING id')

    result = db.exec(sql_query,params={'image':filename,'is_main':is_main,'game_id':game_id})
    db.commit()
    print(result)
    return result


async def test_get_image(db: Session):

    sql_query = text('SELECT * FROM image')
    results = db.exec(sql_query).mappings().first()

    filename = results['image']
    print("==========================")
    print(filename)
    print("==========================")
    with open(filename,"rb") as image_file:
        image = os.path.basename(filename)

    print(image)
    return image


async def delete_image(db: Session,image_id : list[int]):
    sql_query = text('DELETE FROM image WHERE id IN :id')
    result = db.exec(sql_query,params={'id': tuple(image_id)})
    if result.rowcount == 0:
        raise HTTPException(status_code=400,detail='ไม่พบรูปภาพนี้')
    db.commit()
