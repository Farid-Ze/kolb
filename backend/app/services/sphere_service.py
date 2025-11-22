from sqlalchemy.orm import Session
from app.models.klsi.sphere import SphereNode, MemoryReflection, ReflectionType
from app.schemas.sphere import ReflectionCreate
from app.services.assessments import get_latest_assessment_results
from datetime import datetime, timezone
import math
import random

class SphereService:
    def list_nodes(self, db: Session, user_id: int):
        return db.query(SphereNode).filter_by(user_id=user_id).all()

    def create_node_for_event(self, db: Session, user_id: int, event_type: str, metadata: dict):
        # Count existing nodes to determine "distance" or "index"
        count = db.query(SphereNode).filter_by(user_id=user_id).count()
        
        # Simple random distribution on a growing sphere
        radius = 10.0 + (count * 0.5) # Expand as more memories are added
        
        # Random spherical coordinates
        theta = random.uniform(0, 2 * math.pi)
        phi = random.uniform(0, math.pi)
        
        x = radius * math.sin(phi) * math.cos(theta)
        y = radius * math.sin(phi) * math.sin(theta)
        z = radius * math.cos(phi)
        
        node = SphereNode(
            user_id=user_id,
            pos_x=x, 
            pos_y=y, 
            pos_z=z,
            unlock_date=datetime.now(timezone.utc),
            meta={"event_type": event_type, **metadata}
        )
        db.add(node)
        db.commit()
        db.refresh(node)
        return node

    def list_reflections(self, db: Session, user_id: int, reflection_type: ReflectionType | None = None):
        query = db.query(MemoryReflection).filter_by(user_id=user_id)
        if reflection_type:
            query = query.filter(MemoryReflection.reflection_type == reflection_type)
        return query.all()

    def create_reflection(self, db: Session, user_id: int, payload: ReflectionCreate):
        reflection = MemoryReflection(
            user_id=user_id,
            sphere_node_id=payload.sphere_node_id,
            content=payload.content,
            reflection_type=payload.reflection_type,
            created_at=datetime.now(timezone.utc)
        )
        db.add(reflection)
        db.commit()
        db.refresh(reflection)
        return reflection

    def get_prompt_for_user(self, db: Session, user_id: int) -> str:
        results = get_latest_assessment_results(db, user_id)
        if not results:
            return "Reflect on your journey so far. What are your goals?"
        
        # Determine style from kite coordinates
        kite = results.get("kite_coordinates", {})
        
        # Simple logic: Find dominant mode (highest score)
        if not kite:
             return "What is on your mind today?"

        dominant_mode = max(kite, key=kite.get)
        
        prompts = {
            "CE": "How did this experience make you feel? What specific moments stood out?",
            "RO": "What did you observe? What does this mean for you personally?",
            "AC": "What concepts or theories apply here? How does this fit into your understanding?",
            "AE": "What will you do differently next time? How can you apply this immediately?"
        }
        
        return prompts.get(dominant_mode, "Reflect on your recent experiences.")

sphere_service = SphereService()
