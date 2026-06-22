from datetime import date, datetime, timedelta, time

from typing import Annotated
from zoneinfo import ZoneInfo

from dns.ttl import make
from fastapi import APIRouter, Query, Depends
from sqlmodel import desc
from app.dependencies import DbSession,RequirePermission
from ....schema.dashboard import DonutChartByCategory,TimeMode
from app.crud import dashboard as crud_dashboard
from app.schema.template import ResponseTemplate,ResponseTemplateConstructor




router = APIRouter(
    prefix='/dashboard',
    tags=['dashboard']
)


@router.get('/chart/donut', response_model=ResponseTemplate[DonutChartByCategory])
async def get_donut_chart(
    db: DbSession,category_id:int ,
    currrent_user : Annotated[str, Depends(RequirePermission(['owner']))],
    mode: Annotated[TimeMode,Query(description='Select dropdown')] = TimeMode.day):
    
    tz_bkk = ZoneInfo('Asia/Bangkok')
    now_bkk = datetime.now(tz_bkk)
    today_date = now_bkk.date()

    def make_dt(d: date, is_end: bool = False ):
        t = time.max if is_end else time.min
        return datetime.combine(d,t,tzinfo=None)


    if mode == TimeMode.year:
        start_date = make_dt(date(today_date.year,1,1))
        end_date = make_dt(today_date,is_end=True)
    elif mode == TimeMode.month:
        start_date = make_dt(date(today_date.year,today_date.month,1))
        end_date = make_dt(today_date,is_end=True)
    elif mode == TimeMode.week:
        start_date = make_dt(today_date - timedelta(today_date.weekday()))
        end_date = make_dt(today_date,is_end=True)
    else :
        start_date = make_dt(today_date)
        end_date = make_dt(today_date,is_end=True)
    results = await crud_dashboard.get_v2_donut_chart(db,category_id,start_date,end_date)

    return ResponseTemplateConstructor('200','OK','Fetch Donut Chart', results )
    

    