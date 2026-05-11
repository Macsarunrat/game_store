from fastapi import APIRouter,Depends
from ..dependencies import DbSession,RequirePermission
from ..crud import order as crud_order
from ..schema.template import ResponseTemplate, ResponseTemplateConstructor
from ..schema.order import OrderResponse
from typing import Annotated

router = APIRouter(
    prefix='/order',
    tags=['order']
)


@router.get('/',response_model=ResponseTemplate[list[OrderResponse]])
async def get_order(db : DbSession,current_user : Annotated[str,Depends(RequirePermission(['customer','admin','owner']))]):
    results = await crud_order.get_order(db)
    return ResponseTemplateConstructor(200,'OK','get order successfully',results)
    

@router.patch('/confirm', response_model= ResponseTemplate[str])
async def confirm_order(db : DbSession, current_user : Annotated[str, Depends(RequirePermission(['owner','admin']))],order_id : int):
    """
    สำหรับยืนยันออเดอร์ที่เข้ามา
    """
    print("Order ID")
    print(order_id)
    await crud_order.update_status(db=db,order_id=order_id)
    
    return ResponseTemplateConstructor(200,'OK','Confirm Successfully', None)

    