from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
@patch("app.api.v1.demo.run_demo_seed")
async def test_demo_seed_endpoint(mock_run_demo_seed):
    """
    Tests POST /api/v1/demo/seed endpoint returns 201 Created and response payload.
    """
    mock_run_demo_seed.return_value = {
        "status": "success",
        "message": "Successfully seeded 6 demo documents.",
        "documents": [
            {"id": "doc-1", "filename": "01_quotation.txt", "status": "PARSED"}
        ],
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/demo/seed")

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert "seeded" in data["message"]
    mock_run_demo_seed.assert_called_once()
