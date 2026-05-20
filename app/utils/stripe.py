import email

import stripe
from ..schema.stripe import PaymentRequest
from app.core.settings import settings
from fastapi import APIRouter


router = APIRouter(
    prefix='/stripe',
    tags=['stripe']
)


stripe.api_key = settings.stripe_secret_key

@router.post('/create_payment')
async def create_payment(request : PaymentRequest):
    try:
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            receipt_email=request.customer_email,
            payment_method="pm_card_visa",
            confirm=True,
            return_url=settings.domain
        )
        return {
            "Payment_intent_id" : intent.id,
            "status" : intent.status
        }

    except Exception as e:
        return e

