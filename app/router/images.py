from fastapi import File, UploadFile,APIRouter,Depends
from ..dependencies import DbSession,cast_to_json
import shutil
from pathlib import Path
from  ..schema.images import ImageUpload,ImageDelete
from ..crud import images as crud_image
from typing import Annotated

from ..schema.template import ResponseTemplate, ResponseTemplateConstructor


router = APIRouter(
    prefix='/image',
    tags=['image']
)



UPLOADIMAGE_DIR = Path('upload')
UPLOADIMAGE_DIR.mkdir(exist_ok=True)

@router.post('/upload-image')
async def upload_image(db: DbSession,body : Annotated[ImageUpload,Depends(cast_to_json)],file: Annotated[UploadFile,File(...)]):
    is_main = body.is_main
    game_id = body.game_id
    file_path = UPLOADIMAGE_DIR / file.filename

    with open(file_path,'wb') as Buffer:
        shutil.copyfileobj(file.file,Buffer)

    await crud_image.save_fimename(db=db,filename=str(file_path.as_posix()),is_main=is_main,game_id=game_id)

    return ResponseTemplateConstructor(200,'OK','uploadded successfully',detail=None)

    
@router.get('/test/get-image')
async def get_image(db: DbSession):
    image_name = await crud_image.test_get_image(db)

    image_url = f"/static/{image_name}"
    
    return {
        "file_name": image_name,
        "image_url": image_url 
    }

@router.delete('/delete-image-list' , response_model= ResponseTemplate[str])
async def delete_image_list(db: DbSession, body: ImageDelete):
    await crud_image.delete_image(db=db,image_id=body.image_id)
    return ResponseTemplateConstructor('200','OK','delete successfully',None)
