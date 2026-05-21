from fastapi import APIRouter, Depends
from ....dependencies import DbSession, RequirePermission
from ....crud import dashboard as crud_dashboard
from ....schema.template import ResponseTemplate, ResponseTemplateConstructor
from fastapi.encoders import jsonable_encoder
from ....schema.dashboard import Header,DonutChart,BarChart
from typing import List ,Annotated

router = APIRouter(
    prefix='/dashboard',
    tags=['dashboard']
)



@router.get('/header', response_model= ResponseTemplate[Header])
async def get_header(db: DbSession, current_user : Annotated[str,Depends(RequirePermission(['owner']))]):
    results = await crud_dashboard.get_header(db)
    return ResponseTemplateConstructor('200','OK','Fetch header part successfully', results)


@router.get('/chart/donut', response_model=ResponseTemplate[List[DonutChart]])
async def get_chart_donut(db: DbSession, current_user : Annotated[str,Depends(RequirePermission(['owner']))]):
    results = await crud_dashboard.get_chart_donut(db)
    json_data = jsonable_encoder(results)
    return ResponseTemplateConstructor(200,'OK','Fetch donut chart ', json_data)


@router.get('/chart/bar', response_model=ResponseTemplate[List[BarChart]])
async def get_bar_chart(db: DbSession, current_user : Annotated[str,Depends(RequirePermission(['owner']))]):
    results = await crud_dashboard.get_bar_chart(db)
    json_data = jsonable_encoder(results)
    return ResponseTemplateConstructor(200,'OK','Fetch bar chart', json_data)
