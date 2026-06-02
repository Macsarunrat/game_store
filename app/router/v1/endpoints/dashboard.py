from calendar import week
import datetime
from pydoc import describe

from fastapi import APIRouter, Depends, Query
from sentry_sdk.utils import now
from ....dependencies import DbSession, RequirePermission
from ....crud import dashboard as crud_dashboard
from ....schema.template import ResponseTemplate, ResponseTemplateConstructor
from fastapi.encoders import jsonable_encoder
from ....schema.dashboard import Header,DonutChart,BarChart, ResponseTrendLineChart, TimeMode,TrendlineChart
from typing import List ,Annotated
from datetime import date, time, timedelta,datetime
from zoneinfo import ZoneInfo
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

@router.get('/chart/trendline', response_model=ResponseTemplate[ResponseTrendLineChart])
async def get_trendline_chart(db: DbSession, current_user : Annotated[str,Depends(RequirePermission(['owner']))], mode : Annotated[TimeMode,Query(description='Select dropdown')] = TimeMode.day):
    tz_bkk = ZoneInfo('Asia/Bangkok')
    now_bkk = datetime.now(tz_bkk)
    today_date = now_bkk.date()


    step = timedelta(days=1)
    date_format = "YYYY-MM-DD"

    print("TIME")
    print(now_bkk)


    def make_dt(d:date, is_end: bool = False):
        t = time.max if is_end else time.min 
        return datetime.combine(d,t, tzinfo=tz_bkk)


    if mode == TimeMode.year:
        start_date = make_dt(date(today_date.year,1,1))
        end_date = make_dt(today_date,is_end=True)
    elif mode == TimeMode.month:
        start_date = make_dt(date(today_date.year,today_date.month,1))
        end_date = make_dt(today_date,is_end=True)
    elif mode == TimeMode.week:
        start_date = make_dt(today_date - timedelta(days=6))
        end_date = make_dt(today_date,is_end=True)
    else :
        step = timedelta(hours=1)
        date_format = "YYYY-MM-DD HH24:00"
        start_date = make_dt(today_date) 
        end_date = datetime.combine(today_date,datetime.time(now_bkk),tzinfo=tz_bkk)


    results = await crud_dashboard.get_trend_line_chart(db,start_date,end_date,step=step,date_format=date_format)
    json_data = jsonable_encoder(results)
    
    response_data = {
        'trend_data' : json_data,
        'mode': mode.value
    }

    return ResponseTemplateConstructor(200,'OK','Fetch trendline chart', response_data)
