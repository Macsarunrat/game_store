import stripe
from ....schema.stripe import PaymentRequest
from app.core.settings import settings
from fastapi import APIRouter, HTTPException, Header, Request, BackgroundTasks
from typing import Optional, Annotated
from app.crud import order as crud_order
from ....dependencies import DbSession
import json
from app.utils.email import send_email
from app.schema.email import SendEmail

router = APIRouter(
    prefix='/stripe',
    tags=['stripe']
)


stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post('/webhook')
async def stripe_webhook(db: DbSession,request : Request, background_tasks : BackgroundTasks, stripe_signature : Optional[str]=Header(None)):
    payload = await request.body()
    event = None
    try :
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK
        )
    
    except ValueError :
        print('Invalid Payload')
        raise HTTPException(status_code=400,detail='Invalid Payload')
    except stripe.error.SignatureVerificationError:
        print('Invalid Signature')
        raise HTTPException(status_code=400,detail='Invalid Signature')
    
    if event.type == "checkout.session.completed":
        event_dict = json.loads(payload)
        sesstion_data = event_dict.get('data',{}).get('object',{})

        order_id = sesstion_data.get('metadata',{}).get('order_id',{})
        stripe_session_id = sesstion_data.get('id')

        if order_id:
            await crud_order.update_status(db=db,stripe_session_id=str(stripe_session_id), order_id=int(order_id))
            
        
        email_detail = await crud_order.get_order_by_id(db,order_id=int(order_id))
        data = {
        "email" : email_detail.get('email'),
        "customer_name" : email_detail.get('first_name'),
        "order_id" : email_detail.get('id'),
        "game" : email_detail.get('name'),
        "price" : email_detail.get('price')

    }
        body = SendEmail(**data)
        await send_email(body,background_tasks)

        return {'status':'suscess'}





