from json import load
from fastapi_mail import ConnectionConfig, MessageSchema, MessageType, FastMail
from dotenv import load_dotenv
import os
from pathlib import Path
from pydantic import BaseModel, EmailStr
from app.schema.email import SendEmail
from fastapi import BackgroundTasks


load_dotenv()


conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"), # This now uses your App Password
    MAIL_FROM=os.getenv("MAIL_USERNAME"),            # Must be an email address!
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent / 'template'
)





async def send_email(body : SendEmail, background_tasks : BackgroundTasks):
    message = MessageSchema(
        subject= "Order Confirmation",
        recipients=[body.email],
        template_body={
            "customer_name" : body.customer_name,
            "order_id" : body.order_id,
            "game" : body.game,
            "price" : body.price
        },
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message,message,template_name="email.html")
    return {'message':'success'}
    