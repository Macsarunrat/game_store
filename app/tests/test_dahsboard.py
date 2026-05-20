from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
import pytest
import pytest_asyncio
from app.main import app

pytest_mask = pytest.mark.asyncio

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


async def test_get_dashboard_header(async_client):
    response = await async_client.get('/api/v1/dashboard/header')

    assert response.status_code == 200

    data = response.json()

    assert "status_code" in data
    assert "status" in data
    assert "detail" in data
    assert "total_income" in data.get('detail')
    assert "best_seller_game" in data.get('detail')
    assert "total_order" in data.get('detail')


async def test_get_dashboard_donut_chart(async_client):
    response = await async_client.get('/api/v1/dashboard/chart/donut')

    assert response.status_code == 200

    data = response.json()

    assert "status_code" in data
    assert "status" in data
    assert "detail" in data
   

async def test_get_dashboard_bar_chart(async_client):
    response = await async_client.get('/api/v1/dashboard/chart/bar')

    assert response.status_code == 200

    data = response.json()

    assert "status_code" in data
    assert "status" in data
    assert "detail" in data
    
