import pytest
import pytest_asyncio
from app.core.authentication import create_access_token



pytest_mask = pytest.mark.asyncio

@pytest_asyncio.fixture
async def owner_header():
    token_data = {'role_name': 'owner'}
    token = create_access_token(data=token_data)
    print("TEST TOKEN")
    print(token)
    return {'Authorization' : f'Bearer {token}'}

