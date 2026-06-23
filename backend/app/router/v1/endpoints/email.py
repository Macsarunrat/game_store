from fastapi import APIRouter , BackgroundTasks
from fastapi_mail import MessageSchema, MessageType, FastMail
from app.schema.email import EmailRequest
from app.utils.email import conf


router = APIRouter(
    prefix='/email',
    tags=['email']
)



@router.post('/send-email')
async def send_email(request : EmailRequest, background_tasks : BackgroundTasks):
    message = MessageSchema(
        subject= request.subject,
        recipients=[request.email],
        template_body={
            "customer_name" : "test",
            "order_id" : "1",
            "game" : "gta",
            "price" : "120"
        },
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message,message,template_name="email.html")
    return {'message':'success'}