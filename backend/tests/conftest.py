import pytest
import pytest_asyncio
import sys
import types
import importlib.machinery
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

# Sklearn stub for testing environment
if "sklearn" not in sys.modules:
    m = types.ModuleType("sklearn")
    m.__spec__ = importlib.machinery.ModuleSpec("sklearn", None)
    sys.modules["sklearn"] = m
    mm = types.ModuleType("sklearn.metrics")
    mm.__spec__ = importlib.machinery.ModuleSpec("sklearn.metrics", None)
    mm.roc_curve = lambda *a, **k: None
    sys.modules["sklearn.metrics"] = mm

from app.main import app
from app.db.mongodb import get_db, db_manager
from app.db.indexes import create_indexes
from app.core.security import create_access_token, get_password_hash
from app.models.user import UserModel
from app.repositories.user_repository import UserRepository

@pytest_asyncio.fixture(scope="session")
async def test_db():
    mock_client = AsyncMongoMockClient()
    db = mock_client["manavoice_ai_test"]
    await create_indexes(db)
    return db

@pytest_asyncio.fixture(autouse=True)
async def override_db(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    yield
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

@pytest_asyncio.fixture
async def test_user(test_db):
    user_repo = UserRepository(test_db)
    email = "testuser@manavoice.ai"
    existing = await user_repo.get_by_email(email)
    if existing:
        return existing

    user = UserModel(
        email=email,
        password_hash=get_password_hash("ValidPass123!"),
        display_name="Test User",
    )
    return await user_repo.create(user)

@pytest_asyncio.fixture
async def auth_headers(test_user):
    token = create_access_token({"sub": test_user["id"], "email": test_user["email"]})
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def second_test_user(test_db):
    user_repo = UserRepository(test_db)
    email = "seconduser@manavoice.ai"
    existing = await user_repo.get_by_email(email)
    if existing:
        return existing

    user = UserModel(
        email=email,
        password_hash=get_password_hash("ValidPass456!"),
        display_name="Second User",
    )
    return await user_repo.create(user)

@pytest_asyncio.fixture
async def second_auth_headers(second_test_user):
    token = create_access_token({"sub": second_test_user["id"], "email": second_test_user["email"]})
    return {"Authorization": f"Bearer {token}"}
