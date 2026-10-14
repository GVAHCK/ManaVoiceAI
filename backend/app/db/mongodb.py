import asyncio
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

try:
    from mongomock_motor import AsyncMongoMockClient
except ImportError:
    AsyncMongoMockClient = None

class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_mock: bool = False

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            # Try connecting with a short timeout
            real_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            )
            # Test ping
            await real_client.admin.command("ping")
            self.client = real_client
            self.db = self.client[settings.MONGODB_DATABASE]
            self.is_mock = False
            logger.info(f"Connected successfully to live MongoDB database '{settings.MONGODB_DATABASE}'")
        except Exception as exc:
            if settings.ENVIRONMENT == "production" or not settings.ALLOW_MOCK_DB:
                logger.critical(
                    f"FATAL: Production MongoDB connection failed at {settings.MONGODB_URI} ({exc}). "
                    "Silent in-memory fallback is strictly prohibited in production mode."
                )
                raise RuntimeError(
                    f"Production MongoDB database connection failed: {exc}. "
                    "Ensure MongoDB service is running and accessible."
                )

            logger.warning(
                f"Could not connect to live MongoDB at {settings.MONGODB_URI} ({exc}). "
                "Development/testing fallback active: Initializing embedded in-memory MongoDB engine."
            )
            if AsyncMongoMockClient is not None:
                self.client = AsyncMongoMockClient()
                self.db = self.client[settings.MONGODB_DATABASE]
                self.is_mock = True
                logger.info(f"Initialized in-memory MongoDB database '{settings.MONGODB_DATABASE}' (Development Mode)")
            else:
                raise RuntimeError("Live MongoDB unavailable and mongomock_motor not installed.")

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    def get_database(self) -> AsyncIOMotorDatabase:
        if self.db is None:
            raise RuntimeError("Database is not connected. Call connect() first.")
        return self.db

db_manager = MongoDBManager()

async def get_db() -> AsyncIOMotorDatabase:
    return db_manager.get_database()
