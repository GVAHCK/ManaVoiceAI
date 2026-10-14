from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

class SavedAudioRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.saved_audio
        self.generations_collection = db.generations

    async def save(self, user_id: str, generation_id: str) -> bool:
        # Check that generation belongs to user
        gen = await self.generations_collection.find_one({
            "_id": ObjectId(generation_id),
            "user_id": user_id,
        })
        if not gen:
            return False

        try:
            await self.collection.update_one(
                {"user_id": user_id, "generation_id": generation_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "generation_id": generation_id,
                        "created_at": datetime.now(timezone.utc),
                    }
                },
                upsert=True,
            )
            return True
        except Exception:
            return False

    async def unsave(self, user_id: str, generation_id: str) -> bool:
        result = await self.collection.delete_one({
            "user_id": user_id,
            "generation_id": generation_id,
        })
        return result.deleted_count > 0

    async def is_saved(self, user_id: str, generation_id: str) -> bool:
        doc = await self.collection.find_one({
            "user_id": user_id,
            "generation_id": generation_id,
        })
        return doc is not None

    async def list_saved_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", DESCENDING)
        saved_items = await cursor.to_list(100)
        if not saved_items:
            return []

        gen_ids = [ObjectId(item["generation_id"]) for item in saved_items if ObjectId.is_valid(item["generation_id"])]
        gen_cursor = self.generations_collection.find({"_id": {"$in": gen_ids}, "user_id": user_id})
        
        gen_map = {}
        async for g in gen_cursor:
            g_id = str(g.pop("_id"))
            g["id"] = g_id
            g["is_saved"] = True
            gen_map[g_id] = g

        results = []
        for s in saved_items:
            gid = s["generation_id"]
            if gid in gen_map:
                results.append(gen_map[gid])

        return results
