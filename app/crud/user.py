from sqlmodel import text, Session




async def login(db: Session, username, password):
    sql_query = text(
        'SELECT u.id,u.username, u.password, u.role_id, role.name FROM "user" u JOIN role ON u.role_id = role.id ' \
        'WHERE u.username= :username and u.password= :password' \
        ' '
        )
    results = db.exec(sql_query,params={'username':username,'password': password}).mappings().first()
    if results:
        results = dict(results)
        results['role_name'] = results['name']
        print("==========================================")
        print(results)
        print("==========================================")
        role_id = results.pop('role_id')
        user_id = results.pop('id')
        results.pop('name')
        
        # ดึงข้อมูลลูกค้า หากเป็นลูกค้า
        if role_id == 1:
            sql_query = text('SELECT first_name,last_name FROM customer WHERE user_id = :user_id')
            customer_name = db.exec(sql_query,params={'user_id':user_id}).mappings().first()
            print("==========================================")
            print(user_id)
            print(customer_name)
            print("==========================================")
            results['first_name'] = customer_name['first_name']
            results['last_name'] = customer_name['last_name']
            return results
        
        #ดึงข้อมูลร้านหากเป็นร้านค้า
        if role_id == 2:
            sql_query = text('SELECT name , description FROM shop WHERE user_id = :user_id')
            shop_detail = db.exec(sql_query,params={'user_id': user_id}).mappings().first()
            print("==========================================")
            print(user_id)
            print(shop_detail)
            print("==========================================")
            results['name'] = shop_detail['name']
            results['description'] = shop_detail['description']
            return results
        
        return results
    return None
