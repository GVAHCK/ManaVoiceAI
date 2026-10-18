from pymongo import ASCENDING, DESCENDING
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging import logger

async def create_indexes(db: AsyncIOMotorDatabase):
    try:
        # Users collection indexes
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("created_at", DESCENDING)])

        # Generations collection indexes
        await db.generations.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.generations.create_index([("user_id", ASCENDING), ("status", ASCENDING)])
        await db.generations.create_index([("user_id", ASCENDING), ("target_language", ASCENDING)])
        await db.generations.create_index([("created_at", DESCENDING)])

        # Saved audio collection indexes
        await db.saved_audio.create_index([("user_id", ASCENDING), ("generation_id", ASCENDING)], unique=True)
        await db.saved_audio.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

        # Refresh tokens collection
        await db.refresh_tokens.create_index([("user_id", ASCENDING)])
        await db.refresh_tokens.create_index([("token", ASCENDING)], unique=True)
        # Localization jobs collection indexes
        await db.localization_jobs.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.localization_jobs.create_index([("user_id", ASCENDING), ("status", ASCENDING)])
        await db.localization_jobs.create_index([("created_at", DESCENDING)])

        logger.info("MongoDB database indexes successfully created and verified.")

    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
