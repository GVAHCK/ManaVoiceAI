from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING, ASCENDING
from app.models.localization_job import LocalizationJobModel

class LocalizationRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.localization_jobs

    async def create(self, job: LocalizationJobModel) -> Dict[str, Any]:
        data = job.model_dump(by_alias=True, exclude=["id"])
        result = await self.collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        if "_id" in data:
            del data["_id"]
        return data

    async def get_by_id(self, job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(job_id), "user_id": user_id})
            if doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        except Exception:
            return None

    async def get_by_id_internal(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Worker internal fetch without user filter."""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(job_id)})
            if doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        except Exception:
            return None

    async def update(self, job_id: str, updates: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc)
        query: Dict[str, Any] = {"_id": ObjectId(job_id)}
        if user_id:
            query["user_id"] = user_id

        result = await self.collection.find_one_and_update(
            query,
            {"$set": updates},
            return_document=True,
        )
        if result:
            result["id"] = str(result.pop("_id"))
        return result

    async def add_log(self, job_id: str, log_message: str):
        await self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$push": {"processing_logs": log_message},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            }
        )

    async def update_stage(self, job_id: str, stage: str, progress_pct: int, log_line: Optional[str] = None):
        update_doc: Dict[str, Any] = {
            "current_stage": stage,
            "stage_progress_pct": progress_pct,
            "updated_at": datetime.now(timezone.utc),
        }
        push_doc = {}
        if log_line:
            push_doc["processing_logs"] = log_line

        cmd: Dict[str, Any] = {"$set": update_doc}
        if push_doc:
            cmd["$push"] = push_doc

        await self.collection.update_one({"_id": ObjectId(job_id)}, cmd)

    async def delete(self, job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"_id": ObjectId(job_id), "user_id": user_id})
        if not doc:
            return None
        await self.collection.delete_one({"_id": ObjectId(job_id), "user_id": user_id})
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def list_user_jobs(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status.lower()
        if job_type:
            query["job_type"] = job_type.lower()

        total = await self.collection.count_documents(query)
        skip = (page - 1) * page_size
        cursor = self.collection.find(query).sort("created_at", DESCENDING).skip(skip).limit(page_size)

        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)

        return items, total

    async def update_segment(
        self,
        job_id: str,
        user_id: str,
        segment_id: int,
        original_text: Optional[str] = None,
        translated_text: Optional[str] = None,
        speaker: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        job = await self.get_by_id(job_id, user_id)
        if not job:
            return None

        segments = job.get("segments", [])
        updated = False
        for s in segments:
            if s.get("id") == segment_id:
                if original_text is not None:
                    s["original_text"] = original_text
                if translated_text is not None:
                    s["translated_text"] = translated_text
                    s["text"] = translated_text
                if speaker is not None:
                    s["speaker"] = speaker
                updated = True
                break

        if updated:
            return await self.update(job_id, {"segments": segments}, user_id=user_id)
        return job
