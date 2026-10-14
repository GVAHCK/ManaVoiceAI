from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING, ASCENDING
from app.models.generation import GenerationModel

class GenerationRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.generations

    async def create(self, gen: GenerationModel) -> Dict[str, Any]:
        data = gen.model_dump(by_alias=True, exclude=["id"])
        result = await self.collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        if "_id" in data:
            del data["_id"]
        return data

    async def get_by_id(self, gen_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(gen_id), "user_id": user_id})
            if doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        except Exception:
            return None

    async def update(self, gen_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(gen_id), "user_id": user_id},
            {"$set": updates},
            return_document=True,
        )
        if result:
            result["id"] = str(result.pop("_id"))
        return result

    async def delete(self, gen_id: str, user_id: str) -> Optional[str]:
        # Return storage_key if deleted so file can be removed from disk
        doc = await self.collection.find_one({"_id": ObjectId(gen_id), "user_id": user_id})
        if not doc:
            return None
        storage_key = doc.get("audio_storage_key")
        await self.collection.delete_one({"_id": ObjectId(gen_id), "user_id": user_id})
        return storage_key

    async def list_user_generations(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        target_language: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "newest",
    ) -> Tuple[List[Dict[str, Any]], int]:
        query: Dict[str, Any] = {"user_id": user_id}

        if target_language:
            query["target_language"] = target_language.lower()
        if status:
            query["status"] = status.lower()
        if search:
            query["$or"] = [
                {"original_text": {"$regex": search, "$options": "i"}},
                {"translated_text": {"$regex": search, "$options": "i"}},
            ]

        total = await self.collection.count_documents(query)
        sort_order = DESCENDING if sort_by == "newest" else ASCENDING

        skip = (page - 1) * page_size
        cursor = self.collection.find(query).sort("created_at", sort_order).skip(skip).limit(page_size)

        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)

        return items, total

    async def get_recent_activity(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", DESCENDING).limit(limit)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        return items

    async def get_summary_metrics(self, user_id: str) -> Dict[str, Any]:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": None,
                    "total_generations": {"$sum": 1},
                    "successful_generations": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                    },
                    "failed_generations": {
                        "$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}
                    },
                    "total_duration": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, "$duration_seconds", 0]}
                    },
                    "total_characters": {
                        "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, "$character_count", 0]}
                    },
                    "languages_used": {
                        "$addToSet": {"$cond": [{"$eq": ["$status", "completed"]}, "$target_language", "$$REMOVE"]}
                    },
                }
            },
        ]
        results = await self.collection.aggregate(pipeline).to_list(1)
        if not results:
            return {
                "total_generations": 0,
                "successful_generations": 0,
                "failed_generations": 0,
                "total_duration": 0.0,
                "total_characters": 0,
                "languages_used_count": 0,
                "success_rate": 0.0,
            }

        res = results[0]
        total = res.get("total_generations", 0)
        successful = res.get("successful_generations", 0)
        failed = res.get("failed_generations", 0)
        duration = float(res.get("total_duration", 0.0))
        chars = int(res.get("total_characters", 0))
        languages = res.get("languages_used", [])

        attempts = successful + failed
        success_rate = (successful / attempts * 100.0) if attempts > 0 else 0.0

        return {
            "total_generations": total,
            "successful_generations": successful,
            "failed_generations": failed,
            "total_duration": duration,
            "total_characters": chars,
            "languages_used_count": len(languages),
            "success_rate": round(success_rate, 1),
        }

    async def get_daily_activity(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        cursor = self.collection.find({
            "user_id": user_id,
            "created_at": {"$gte": since}
        }).sort("created_at", ASCENDING)

        daily_map: Dict[str, Dict[str, Any]] = {}
        # Prepopulate all days so chart has a smooth timeline with 0 values
        for i in range(days):
            day_dt = since + timedelta(days=i + 1)
            date_str = day_dt.strftime("%Y-%m-%d")
            daily_map[date_str] = {
                "date": date_str,
                "count": 0,
                "success_count": 0,
                "failed_count": 0,
                "duration_seconds": 0.0,
                "characters": 0,
            }

        async for doc in cursor:
            dt = doc.get("created_at")
            if isinstance(dt, datetime):
                date_str = dt.strftime("%Y-%m-%d")
                if date_str in daily_map:
                    daily_map[date_str]["count"] += 1
                    if doc.get("status") == "completed":
                        daily_map[date_str]["success_count"] += 1
                        daily_map[date_str]["duration_seconds"] += doc.get("duration_seconds", 0.0)
                        daily_map[date_str]["characters"] += doc.get("character_count", 0)
                    elif doc.get("status") == "failed":
                        daily_map[date_str]["failed_count"] += 1

        return list(daily_map.values())

    async def get_language_distribution(self, user_id: str) -> List[Dict[str, Any]]:
        pipeline = [
            {"$match": {"user_id": user_id, "status": "completed"}},
            {
                "$group": {
                    "_id": "$target_language",
                    "count": {"$sum": 1},
                    "duration": {"$sum": "$duration_seconds"}
                }
            },
            {"$sort": {"count": -1}},
        ]
        results = await self.collection.aggregate(pipeline).to_list(20)
        total_count = sum(r["count"] for r in results) if results else 0

        output = []
        for r in results:
            lang_code = r["_id"] or "unknown"
            cnt = r["count"]
            pct = round((cnt / total_count * 100), 1) if total_count > 0 else 0.0
            output.append({
                "language": lang_code,
                "name": lang_code.upper(),
                "count": cnt,
                "duration": round(r["duration"], 1),
                "percentage": pct,
            })
        return output

    async def get_monthly_usage(self, user_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        first_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": first_of_month},
                }
            },
            {
                "$group": {
                    "_id": None,
                    "count": {"$sum": 1},
                    "characters": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, "$character_count", 0]}},
                    "duration": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, "$duration_seconds", 0]}},
                }
            }
        ]
        res = await self.collection.aggregate(pipeline).to_list(1)
        if not res:
            return {"count": 0, "characters": 0, "duration": 0.0}
        return {
            "count": res[0].get("count", 0),
            "characters": res[0].get("characters", 0),
            "duration": round(res[0].get("duration", 0.0), 1),
        }
