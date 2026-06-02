import stripe




class Stripe():
            
    
    @staticmethod
    async def strip_create_session(game_price : int, order_id : int, game_name : str | None,game_description : str, customer_email: str):
        success_url = f"http://192.168.1.95:4200/payment/success?order_id={order_id}"
        cancel_url = f"http://192.168.1.95:4200/payment/cancel?order_id={order_id}"
            
        session = stripe.checkout.Session.create(
            customer_email= customer_email,
            payment_method_types=['promptpay','card'],
            line_items= [
                {
                    'price_data':{
                        'currency':'thb',
                        'product_data': {'name':f'Game : {game_name}','description':f'description:\n {game_description}'},
                        'unit_amount':game_price*100
                    },
                    "quantity":1
                }
            ],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata= {
                'order_id' : order_id
                }
            )
        return session