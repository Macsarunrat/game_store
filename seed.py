import asyncio
import os
import sys
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Ensure the root of the project is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel, select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

from app.model import (
    Role, User, User_Refresh_Token,
    Game, Catagory, Game_catagory, Image,
    Order, Friends, Chat_History, Game_Logs, Image_Logs
)
from app.core.authentication import get_password_hash

load_dotenv()

# List of categories to seed
CATEGORIES = [
    "Action",
    "Adventure",
    "RPG",
    "Strategy",
    "Simulation",
    "Shooter",
    "Horror",
    "Racing",
    "Sports",
    "Indie"
]

# List of 52 games to seed
GAMES_DATA = [
    {
        "name": "Elden Ring",
        "description": "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
        "price": 1790,
        "categories": ["RPG", "Action", "Adventure"]
    },
    {
        "name": "Cyberpunk 2077",
        "description": "Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary.",
        "price": 1790,
        "categories": ["RPG", "Shooter", "Action"]
    },
    {
        "name": "The Witcher 3: Wild Hunt",
        "description": "As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy.",
        "price": 990,
        "categories": ["RPG", "Adventure"]
    },
    {
        "name": "Red Dead Redemption 2",
        "description": "Winner of over 175 Game of the Year Awards and recipient of over 250 perfect scores, Red Dead Redemption 2 is an epic tale of honor and loyalty.",
        "price": 1590,
        "categories": ["Action", "Adventure"]
    },
    {
        "name": "Grand Theft Auto V",
        "description": "When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the underworld.",
        "price": 699,
        "categories": ["Action", "Racing"]
    },
    {
        "name": "Baldur's Gate 3",
        "description": "Gather your party, and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power.",
        "price": 1890,
        "categories": ["RPG", "Strategy"]
    },
    {
        "name": "Hades",
        "description": "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion.",
        "price": 590,
        "categories": ["Action", "Indie"]
    },
    {
        "name": "Hollow Knight",
        "description": "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes.",
        "price": 315,
        "categories": ["Adventure", "Indie"]
    },
    {
        "name": "Stardew Valley",
        "description": "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life.",
        "price": 315,
        "categories": ["Simulation", "RPG", "Indie"]
    },
    {
        "name": "Minecraft",
        "description": "Explore infinite worlds and build everything from the simplest of homes to the grandest of castles.",
        "price": 890,
        "categories": ["Adventure", "Simulation"]
    },
    {
        "name": "Terraria",
        "description": "Dig, fight, explore, build! Nothing is impossible in this action-packed adventure game. The world is your canvas.",
        "price": 219,
        "categories": ["Adventure", "Indie", "RPG"]
    },
    {
        "name": "Subnautica",
        "description": "Descend into the depths of an alien underwater world filled with wonder and peril. Craft gear, pilot submarines and outsmart wildlife.",
        "price": 579,
        "categories": ["Adventure", "Simulation"]
    },
    {
        "name": "Valheim",
        "description": "A brutal 1-10 player co-op survival and exploration game, set in a procedurally-generated purgatory inspired by Viking culture.",
        "price": 289,
        "categories": ["RPG", "Simulation", "Adventure"]
    },
    {
        "name": "Rust",
        "description": "The only aim in Rust is to survive. Overcome struggles such as hunger, thirst and cold. Build a fire. Build a shelter. Kill animals.",
        "price": 739,
        "categories": ["Shooter", "Simulation"]
    },
    {
        "name": "Slay the Spire",
        "description": "We fused card games and roguelikes together to make the best single player deckbuilder we could. Craft a unique deck, encounter bizarre creatures.",
        "price": 379,
        "categories": ["Strategy", "Indie"]
    },
    {
        "name": "Dead Cells",
        "description": "Dead Cells is a rogue-lite, metroidvania action-platformer. You'll explore a sprawling, ever-changing castle... assuming you're able to fight your way past its keepers.",
        "price": 449,
        "categories": ["Action", "Indie"]
    },
    {
        "name": "Sekiro: Shadows Die Twice",
        "description": "Explore late 1500s Sengoku Japan, a brutal period of constant life and death conflict, as you come face to face with larger than life foes.",
        "price": 1790,
        "categories": ["Action", "RPG"]
    },
    {
        "name": "Dark Souls III",
        "description": "As fires fade and the world falls into ruin, FromSoftware continues their critically-acclaimed and genre-defining series.",
        "price": 1490,
        "categories": ["RPG", "Action"]
    },
    {
        "name": "Monster Hunter: World",
        "description": "Welcome to a new world! Take on the role of a hunter and slay ferocious monsters in a living, breathing ecosystem.",
        "price": 739,
        "categories": ["Action", "RPG"]
    },
    {
        "name": "Resident Evil 4",
        "description": "Survival is just the beginning. Six years have passed since the biological disaster in Raccoon City. Leon S. Kennedy tracks the president's missing daughter.",
        "price": 1290,
        "categories": ["Horror", "Shooter", "Action"]
    },
    {
        "name": "Doom Eternal",
        "description": "Hell's armies have invaded Earth. Become the Slayer in an epic single-player campaign to conquer demons across dimensions.",
        "price": 1090,
        "categories": ["Shooter", "Action"]
    },
    {
        "name": "Fallout 4",
        "description": "As the sole survivor of Vault 111, you enter a world destroyed by nuclear war. Every second is a fight for survival.",
        "price": 699,
        "categories": ["RPG", "Shooter"]
    },
    {
        "name": "The Elder Scrolls V: Skyrim",
        "description": "Winner of more than 200 Game of the Year Awards, Skyrim Special Edition brings the epic fantasy to life in stunning detail.",
        "price": 1290,
        "categories": ["RPG", "Adventure"]
    },
    {
        "name": "The Sims 4",
        "description": "Unleash your imagination and create a unique world of Sims that's an expression of you! Explore and customize every detail.",
        "price": 0,
        "categories": ["Simulation"]
    },
    {
        "name": "Cities: Skylines",
        "description": "Cities: Skylines is a modern take on the classic city simulation. The game introduces new game play elements.",
        "price": 599,
        "categories": ["Simulation", "Strategy"]
    },
    {
        "name": "Civilization VI",
        "description": "Civilization VI offers new ways to engage with your world: cities now physically expand across the map.",
        "price": 1290,
        "categories": ["Strategy"]
    },
    {
        "name": "Factorio",
        "description": "Factorio is a game about building and creating automated factories to produce items of increasing complexity.",
        "price": 700,
        "categories": ["Simulation", "Strategy", "Indie"]
    },
    {
        "name": "RimWorld",
        "description": "A sci-fi colony sim driven by an intelligent AI storyteller. Generates stories by simulating psychology, ecology, and more.",
        "price": 549,
        "categories": ["Simulation", "Strategy", "Indie"]
    },
    {
        "name": "Disco Elysium",
        "description": "Disco Elysium - The Final Cut is a groundbreaking role playing game. You're a detective with a unique skill system.",
        "price": 729,
        "categories": ["RPG", "Indie"]
    },
    {
        "name": "Forza Horizon 5",
        "description": "Your Ultimate Horizon Adventure awaits! Explore the vibrant landscapes of Mexico with limitless, fun driving action.",
        "price": 1890,
        "categories": ["Racing", "Sports"]
    },
    {
        "name": "It Takes Two",
        "description": "Embark on the craziest journey of your life. Invite a friend to join for free and work together across a variety of challenges.",
        "price": 1290,
        "categories": ["Adventure", "Action"]
    },
    {
        "name": "Phasmophobia",
        "description": "Phasmophobia is a 4 player co-op online psychological horror. Paranormal activity is on the rise.",
        "price": 320,
        "categories": ["Horror", "Indie"]
    },
    {
        "name": "Among Us",
        "description": "An online and local party game of teamwork and betrayal for 4-15 players... in space!",
        "price": 99,
        "categories": ["Indie", "Strategy"]
    },
    {
        "name": "Left 4 Dead 2",
        "description": "Set in the zombie apocalypse, Left 4 Dead 2 is the highly anticipated sequel to the award-winning co-op shooter.",
        "price": 219,
        "categories": ["Shooter", "Horror", "Action"]
    },
    {
        "name": "Portal 2",
        "description": "The Single Player portion of Portal 2 introduces a cast of dynamic new characters, and a much larger set of devious test chambers.",
        "price": 219,
        "categories": ["Strategy", "Adventure"]
    },
    {
        "name": "Celeste",
        "description": "Help Madeline survive her inner demons on her journey to the top of Celeste Mountain, in this super-tight, hand-crafted platformer.",
        "price": 379,
        "categories": ["Indie", "Adventure"]
    },
    {
        "name": "Outer Wilds",
        "description": "Outer Wilds is an open world mystery about a solar system trapped in an endless time loop.",
        "price": 449,
        "categories": ["Adventure", "Indie"]
    },
    {
        "name": "Dota 2",
        "description": "Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes. Play completely free.",
        "price": 0,
        "categories": ["Strategy", "Action"]
    },
    {
        "name": "Apex Legends",
        "description": "Apex Legends is the award-winning, free-to-play Hero shooter from Respawn Entertainment. Master an ever-growing roster.",
        "price": 0,
        "categories": ["Shooter", "Action"]
    },
    {
        "name": "Destiny 2",
        "description": "Destiny 2 is an action MMO with a single evolving world that you and your friends can join anytime, anywhere.",
        "price": 0,
        "categories": ["Shooter", "RPG", "Action"]
    },
    {
        "name": "Hearts of Iron IV",
        "description": "Victory is at your fingertips! Your ability to lead your nation is your supreme weapon in this WWII strategy game.",
        "price": 1090,
        "categories": ["Strategy"]
    },
    {
        "name": "Stellaris",
        "description": "Explore a galaxy full of wonders in this sci-fi grand strategy game. Interact with diverse alien races.",
        "price": 1090,
        "categories": ["Strategy", "Simulation"]
    },
    {
        "name": "Sea of Thieves",
        "description": "Sea of Thieves offers the essential pirate experience, from sailing and fighting to exploring and looting.",
        "price": 739,
        "categories": ["Adventure", "Action"]
    },
    {
        "name": "Forza Horizon 4",
        "description": "Dynamic seasons change everything at the world's greatest automotive festival. Explore beautiful Britain.",
        "price": 990,
        "categories": ["Racing", "Sports"]
    },
    {
        "name": "FIFA 23",
        "description": "FIFA 23 brings The World's Game to the pitch, with HyperMotion2 Technology, men's and women's tournaments.",
        "price": 1890,
        "categories": ["Sports"]
    },
    {
        "name": "NBA 2K24",
        "description": "Grab your squad and experience the past, present, and future of hoops culture in NBA 2K24.",
        "price": 1990,
        "categories": ["Sports"]
    },
    {
        "name": "Overcooked! 2",
        "description": "Overcooked returns with a brand-new helping of chaotic cooking action! Journey back to the Onion Kingdom.",
        "price": 479,
        "categories": ["Simulation", "Strategy", "Indie"]
    },
    {
        "name": "Fall Guys",
        "description": "Fall Guys is a free, cross-platform party royale game where competitors compete through escalating obstacle courses.",
        "price": 0,
        "categories": ["Action", "Sports", "Indie"]
    },
    {
        "name": "Phasmophobia VR",
        "description": "Experience the ultimate psychological horror in virtual reality. Search for ghosts with realistic interaction.",
        "price": 450,
        "categories": ["Horror", "Indie"]
    },
    {
        "name": "Cyberpunk 2077: Phantom Liberty",
        "description": "Phantom Liberty is a new spy-thriller adventure for Cyberpunk 2077. Return as cyber-enhanced mercenary V.",
        "price": 890,
        "categories": ["RPG", "Action", "Shooter"]
    },
    {
        "name": "Alan Wake 2",
        "description": "A string of ritualistic murders threatens Bright Falls, an eerie small-town community surrounded by wilderness.",
        "price": 1390,
        "categories": ["Horror", "Adventure", "Action"]
    },
    {
        "name": "Lethal Company",
        "description": "A co-op game about salvaging scrap from abandoned, industrialized moons to meet the Company's profit quota.",
        "price": 219,
        "categories": ["Horror", "Indie", "Simulation"]
    }
]

async def seed_data():
    db_url = os.getenv("POSTGRES_URL")
    if db_url and db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    urls_to_try = [db_url]
    if "db:5432" in db_url:
        fallback = db_url.replace("db:5432", "localhost:5434")
        urls_to_try.append(fallback)
        
    engine = None
    for url in urls_to_try:
        try:
            print(f"Trying to connect to database URL: {url}")
            temp_engine = create_async_engine(url, echo=False)
            async with temp_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            engine = temp_engine
            print(f"Connected successfully to: {url}")
            break
        except Exception as e:
            print(f"Failed to connect to {url}: {e}")
            
    if not engine:
        print("CRITICAL ERROR: Could not connect to any database instances.")
        sys.exit(1)
        
    async with AsyncSession(engine) as session:
        print("\n--- Cleaning database tables (ALL models) ---")
        await session.exec(text(
            'TRUNCATE TABLE chat_history, friends, user_refresh_token, "order", image, game_catagory, game, catagory, "user", role, game_logs, image_logs RESTART IDENTITY CASCADE;'
        ))
        await session.commit()
        print("Database tables cleared & sequences reset.")

        print("\n--- Seeding Roles ---")
        roles = {
            "customer": Role(name="customer"),
            "admin": Role(name="admin"),
            "owner": Role(name="owner")
        }
        session.add_all(roles.values())
        await session.flush()
        
        for name, role in roles.items():
            print(f"Role seeded: {role.name} (ID: {role.id})")

        print("\n--- Seeding Users ---")
        user_definitions = [
            # Main roles
            {"username": "customer", "first_name": "John", "last_name": "Doe", "email": "customer@example.com", "role_id": roles["customer"].id},
            {"username": "admin", "first_name": "Jane", "last_name": "Staff", "email": "admin@example.com", "role_id": roles["admin"].id},
            {"username": "owner", "first_name": "Somsak", "last_name": "StoreOwner", "email": "owner@example.com", "role_id": roles["owner"].id},
            # Additional customer users for realistic social & sales statistics
            {"username": "user1", "first_name": "Alice", "last_name": "Smith", "email": "alice@example.com", "role_id": roles["customer"].id},
            {"username": "user2", "first_name": "Bob", "last_name": "Johnson", "email": "bob@example.com", "role_id": roles["customer"].id},
            {"username": "user3", "first_name": "Charlie", "last_name": "Brown", "email": "charlie@example.com", "role_id": roles["customer"].id},
            {"username": "user4", "first_name": "David", "last_name": "Williams", "email": "david@example.com", "role_id": roles["customer"].id},
            {"username": "user5", "first_name": "Emma", "last_name": "Davis", "email": "emma@example.com", "role_id": roles["customer"].id}
        ]
        
        seeded_users = []
        for user_def in user_definitions:
            hashed_pw = await get_password_hash("password123")
            user = User(
                username=user_def["username"],
                password=hashed_pw,
                first_name=user_def["first_name"],
                last_name=user_def["last_name"],
                role_id=user_def["role_id"],
                email=user_def["email"]
            )
            session.add(user)
            seeded_users.append(user)
            
        await session.flush()
        for u in seeded_users:
            print(f"User seeded: {u.username} (ID: {u.id}, Role ID: {u.role_id})")

        print("\n--- Seeding User_Refresh_Tokens ---")
        # Creating active sessions for seeded users
        import uuid
        for u in seeded_users:
            # Active token today
            token_active = User_Refresh_Token(
                user_id=u.id,
                jti=str(uuid.uuid4()),
                is_active=True,
                create_at=datetime.now()
            )
            session.add(token_active)
            # Old inactive token from 3 days ago
            token_old = User_Refresh_Token(
                user_id=u.id,
                jti=str(uuid.uuid4()),
                is_active=False,
                create_at=datetime.now() - timedelta(days=3)
            )
            session.add(token_old)
        await session.flush()
        print("User refresh tokens seeded (active and historical).")

        print("\n--- Seeding Categories ---")
        category_objects = {}
        for cat_name in CATEGORIES:
            cat = Catagory(name=cat_name)
            session.add(cat)
            category_objects[cat_name] = cat
        await session.flush()
        
        for cat_name, cat in category_objects.items():
            print(f"Category seeded: {cat.name} (ID: {cat.id})")

        print("\n--- Seeding Games, Links, Cover & Screenshots ---")
        # Scan upload directory for sub-images (screenshots starting with "ss_")
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "upload")
        ss_files = []
        if os.path.exists(upload_dir):
            ss_files = sorted([
                f for f in os.listdir(upload_dir)
                if f.startswith("ss_") and f.lower().endswith((".jpg", ".png", ".jpeg"))
            ])
        print(f"Found {len(ss_files)} sub-images (screenshots) in upload directory.")

        image_index = 1
        ss_index = 0
        game_objects = []
        image_objects = []
        
        for idx, g_data in enumerate(GAMES_DATA, 1):
            game = Game(
                name=g_data["name"],
                description=g_data["description"],
                price=g_data["price"],
                is_active=True,
                is_hidden=False
            )
            session.add(game)
            await session.flush()  # Populates game.id
            game_objects.append(game)
            
            # Seed Category links
            for cat_name in g_data["categories"]:
                cat_id = category_objects[cat_name].id
                link = Game_catagory(game_id=game.id, catagory_id=cat_id)
                session.add(link)
                
            # Seed Main Image (cyclic from header(1).jpg to header(19).jpg)
            img_file = f"header ({image_index}).jpg"
            image_index += 1
            if image_index > 19:
                image_index = 1
                
            img = Image(image=img_file, is_main=True, game_id=game.id)
            session.add(img)
            image_objects.append(img)

            # Seed 3 Sub-images (is_main=False) cyclically from upload/ss_*
            if ss_files:
                for _ in range(3):
                    ss_file = ss_files[ss_index]
                    ss_index = (ss_index + 1) % len(ss_files)
                    sub_img = Image(image=ss_file, is_main=False, game_id=game.id)
                    session.add(sub_img)
                    image_objects.append(sub_img)
            
            if idx % 10 == 0 or idx == len(GAMES_DATA):
                print(f"Prepared {idx}/{len(GAMES_DATA)} games (with main image and up to 3 screenshots)...")
                
        await session.flush()
        print(f"Successfully seeded {len(GAMES_DATA)} games with categories, cover images, and screenshots.")

        print("\n--- Seeding Friends (Social Network) ---")
        # Define some friendships among customers: customer (1), user1 (4), user2 (5), user3 (6), user4 (7), user5 (8)
        # Note: SQLModel smaller user_id must be smaller than friend_id due to unique constraint logic
        friendships_to_seed = [
            {"user_id": 1, "friend_id": 4, "requester_id": 1, "status": "friend"},  # customer <-> user1
            {"user_id": 1, "friend_id": 5, "requester_id": 5, "status": "friend"},  # customer <-> user2
            {"user_id": 4, "friend_id": 5, "requester_id": 4, "status": "friend"},  # user1 <-> user2
            {"user_id": 5, "friend_id": 6, "requester_id": 5, "status": "pending"}, # user2 <-> user3 (pending)
            {"user_id": 6, "friend_id": 7, "requester_id": 6, "status": "friend"},  # user3 <-> user4
            {"user_id": 7, "friend_id": 8, "requester_id": 7, "status": "friend"}   # user4 <-> user5
        ]
        
        friends_relations = []
        for f_def in friendships_to_seed:
            f = Friends(
                user_id=f_def["user_id"],
                friend_id=f_def["friend_id"],
                requester_id=f_def["requester_id"],
                status=f_def["status"],
                created_at=datetime.now() - timedelta(days=5)
            )
            session.add(f)
            friends_relations.append(f)
        await session.flush()
        
        for f in friends_relations:
            print(f"Friendship seeded: User {f.user_id} <-> Friend {f.friend_id} (Status: {f.status}, ID: {f.id})")

        print("\n--- Seeding Chat History ---")
        # Seed chat messages for friend connections (status='friend')
        chat_templates = [
            # Friendship ID 1: customer (1) and user1 (4)
            {"friendship_id": 1, "sender_id": 1, "message": "Hi Alice! Have you checked out Baldur's Gate 3?", "offset_mins": 60},
            {"friendship_id": 1, "sender_id": 4, "message": "Hey John! Yes, I just bought it yesterday. It is amazing!", "offset_mins": 55},
            {"friendship_id": 1, "sender_id": 1, "message": "Awesome! Let me know if you want to play co-op sometime.", "offset_mins": 50},
            # Friendship ID 2: customer (1) and user2 (5)
            {"friendship_id": 2, "sender_id": 5, "message": "Hi! Do you think Cyberpunk is worth buying now?", "offset_mins": 120},
            {"friendship_id": 2, "sender_id": 1, "message": "Definitely! Especially with the Phantom Liberty expansion.", "offset_mins": 115},
            # Friendship ID 3: user1 (4) and user2 (5)
            {"friendship_id": 3, "sender_id": 4, "message": "Bob, are you playing Elden Ring tonight?", "offset_mins": 30},
            {"friendship_id": 3, "sender_id": 5, "message": "Yes, I am stuck on a boss, need some help!", "offset_mins": 25}
        ]
        
        base_time = datetime.now()
        for chat in chat_templates:
            msg = Chat_History(
                sender_id=chat["sender_id"],
                friendship_id=chat["friendship_id"],
                message=chat["message"],
                created_at=base_time - timedelta(minutes=chat["offset_mins"])
            )
            session.add(msg)
        await session.flush()
        print("Chat histories seeded between friends.")

        print("\n--- Seeding Orders (Sales History over 30 Days) ---")
        # Generate 30 orders spread across the last 30 days to build a realistic dashboard trendline
        # Users that purchase: customer (1), user1 (4), user2 (5), user3 (6), user4 (7), user5 (8)
        purchasing_user_ids = [1, 4, 5, 6, 7, 8]
        game_ids = [g.id for g in game_objects]
        
        orders_count = 35
        success_count = 0
        created_pairs = set()
        for o_idx in range(orders_count):
            attempts = 0
            while attempts < 100:
                buyer_id = random.choice(purchasing_user_ids)
                selected_game_id = random.choice(game_ids)
                pair = (buyer_id, selected_game_id)
                if pair not in created_pairs:
                    created_pairs.add(pair)
                    break
                attempts += 1
            else:
                continue
            
            # spread order dates over the past 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            order_date = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
            
            # 80% success rate
            success = random.random() < 0.8
            if success:
                success_count += 1
                
            stripe_id = f"cs_test_{uuid.uuid4().hex}" if success else None
            
            order = Order(
                user_id=buyer_id,
                game_id=selected_game_id,
                date=order_date,
                is_success=success,
                stripe_session_id=stripe_id
            )
            session.add(order)
            
        await session.flush()
        print(f"Seeded {len(created_pairs)} orders across the past 30 days ({success_count} successful transactions).")

        print("\n--- Seeding Logs (Audit Trail) ---")
        # Game Logs
        admin_user_id = 2
        owner_user_id = 3
        g_logs = [
            Game_Logs(
                user_id=owner_user_id,
                game_id=1,
                action_type="CREATE",
                time=datetime.now() - timedelta(days=10),
                ip_address="192.168.1.100",
                payload={"name": "Elden Ring", "price": 1790}
            ),
            Game_Logs(
                user_id=admin_user_id,
                game_id=2,
                action_type="UPDATE",
                time=datetime.now() - timedelta(days=5),
                ip_address="192.168.1.101",
                payload={"price": 1790, "is_active": True}
            ),
            Game_Logs(
                user_id=owner_user_id,
                game_id=3,
                action_type="UPDATE",
                time=datetime.now() - timedelta(days=2),
                ip_address="192.168.1.100",
                payload={"description": "Updated Witcher 3 description"}
            )
        ]
        session.add_all(g_logs)

        # Image Logs
        img_logs = [
            Image_Logs(
                user_id=admin_user_id,
                image_id=1,
                action_type="UPLOAD",
                time=datetime.now() - timedelta(days=10),
                ip_address="192.168.1.101"
            ),
            Image_Logs(
                user_id=admin_user_id,
                image_id=2,
                action_type="UPLOAD",
                time=datetime.now() - timedelta(days=8),
                ip_address="192.168.1.101"
            )
        ]
        session.add_all(img_logs)
        await session.commit()
        print("Game action logs & Image upload logs seeded.")

        # Flush Redis Cache to clear stale game lists and categories
        print("\n--- Clearing Redis Cache ---")
        import redis
        redis_urls = ["redis://redis:6379/0", "redis://localhost:6379/0"]
        redis_flushed = False
        for r_url in redis_urls:
            try:
                r = redis.from_url(r_url)
                r.flushall()
                print(f"Successfully flushed Redis cache at {r_url}")
                redis_flushed = True
                break
            except Exception as e:
                print(f"Could not connect to Redis at {r_url}: {e}")
        
        if not redis_flushed:
            print("WARNING: Redis cache could not be flushed. Stale data may persist until cache expires.")

        print("\nSeeding completed successfully (ALL models fully seeded)!")

if __name__ == "__main__":
    asyncio.run(seed_data())
