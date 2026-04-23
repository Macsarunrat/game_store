from fastapi import APIRouter
from ..dependencies import DbSession
from ..crud import order as crud_order
from ..schema.template import ResponseTemplate, ResponseTemplateConstructor
from ..schema.order import OrderResponse

router = APIRouter(
    prefix='/order',
    tags=['order']
)


@router.get('/',response_model=ResponseTemplate[list[OrderResponse]])
async def get_order(db : DbSession):
    results = await crud_order.get_order(db)
    return ResponseTemplateConstructor(200,'OK','get order successfully',results)
    