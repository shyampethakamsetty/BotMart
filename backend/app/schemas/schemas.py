from pydantic import BaseModel
from typing import Optional, Any, Dict
class RunRequest(BaseModel):
    workflow_id: int
    params: Optional[Dict[str, Any]] = {}
