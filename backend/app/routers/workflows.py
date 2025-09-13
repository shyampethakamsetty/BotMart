from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.deps import get_current_user, get_db
from app.services.task_queue import enqueue_workflow, get_task_status
from app.models.models import TaskRun, Screenshot
router = APIRouter()

class RunRequest(BaseModel):
    # Original shape
    workflow_id: Optional[int] = None
    params: Dict[str, Any] = {}
    # Dashboard TestConfig shape (optional fields)
    workflow_type: Optional[str] = None
    target_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    # New advanced search filters
    category: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    brand: Optional[str] = None
    sort_by: Optional[str] = None
    # Legacy fields
    search_query: Optional[str] = None
    product_url: Optional[str] = None

class ScreenshotIn(BaseModel):
    filename: str
    content_type: Optional[str] = 'image/png'
    data_base64: str
    step_index: Optional[int] = 0

class CompleteIn(BaseModel):
    status: str
    result: Optional[Dict[str, Any]] = None

@router.post('/run')
async def run_workflow(req: RunRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Prefer provided params; otherwise construct from dashboard TestConfig
    task_params: Dict[str, Any] = dict(req.params or {})

    if not task_params and req.workflow_type:
        wt = (req.workflow_type or '').strip().lower()
        if wt == 'login':
            task_params = {
                'action': 'login',
                'email': req.username or '',
                'password': req.password or '',
                'target_url': req.target_url or '',
            }
        elif wt == 'search':
            task_params = {
                'action': 'search',
                'target_url': req.target_url or '',
                # New advanced search filters
                'category': req.category,
                'price_min': req.price_min,
                'price_max': req.price_max,
                'brand': req.brand,
                'sort_by': req.sort_by or 'default',
                # Legacy field for backward compatibility
                'query': req.search_query or '',
            }
        elif wt == 'add_to_cart':
            task_params = {
                'action': 'add_to_cart',
                'product_url': req.product_url or req.target_url or '',
            }
        else:
            task_params = {
                'action': 'search',
                'target_url': req.target_url or '',
                # New advanced search filters (fallback case)
                'category': req.category,
                'price_min': req.price_min,
                'price_max': req.price_max,
                'brand': req.brand,
                'sort_by': req.sort_by or 'default',
                # Legacy field for backward compatibility
                'query': req.search_query or '',
            }

    workflow_id = req.workflow_id or 1  # default placeholder id
    task_id = enqueue_workflow(workflow_id, task_params, getattr(user, 'id', None))

    # Persist a TaskRun row (pending)
    tr = TaskRun(
        task_id=task_id,
        workflow_id=workflow_id,
        user_id=getattr(user, 'id', None),
        status='pending',
        result=None,
        created_at=datetime.now(timezone.utc)
    )
    db.add(tr)
    db.commit()

    now = datetime.now(timezone.utc).isoformat()
    return {
        'id': task_id,
        'status': 'pending',
        'result': 'Queued',
        'screenshots': [],
        'logs': [],
        'created_at': now,
    }

@router.get('/task/{task_id}')
async def get_task(task_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Read Celery status for live state
    status_payload = get_task_status(task_id)

    # Overlay DB result/status if present and terminal
    tr: TaskRun = db.query(TaskRun).filter(TaskRun.task_id == task_id).first()
    if tr:
        if tr.status in ('success', 'failed'):
            status_payload['status'] = tr.status
            status_payload['result'] = tr.result or status_payload.get('result', '')
        # Build screenshot URLs from DB
        shot_rows: List[Screenshot] = db.query(Screenshot).filter(Screenshot.task_id == task_id).order_by(Screenshot.step_index.asc(), Screenshot.id.asc()).all()
        status_payload['screenshots'] = [f"/api/workflows/task/{task_id}/screenshots/{s.id}" for s in shot_rows]
    return status_payload

@router.post('/task/{task_id}/screenshots')
async def upload_screenshot(task_id: str, payload: ScreenshotIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import base64
    try:
        data = base64.b64decode(payload.data_base64)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid base64 data')

    # Ensure TaskRun exists
    tr = db.query(TaskRun).filter(TaskRun.task_id == task_id).first()
    if not tr:
        tr = TaskRun(task_id=task_id, status='pending', created_at=datetime.now(timezone.utc))
        db.add(tr)
        db.flush()

    s = Screenshot(
        task_id=task_id,
        filename=payload.filename,
        content_type=payload.content_type or 'image/png',
        data=data,
        step_index=payload.step_index or 0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(s)
    db.commit()
    return {'ok': True, 'id': s.id}

@router.get('/task/{task_id}/screenshots/{screenshot_id}')
async def get_screenshot(task_id: str, screenshot_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(Screenshot).filter(Screenshot.id == screenshot_id, Screenshot.task_id == task_id).first()
    if not s:
        raise HTTPException(status_code=404, detail='Not found')
    return Response(content=bytes(s.data), media_type=s.content_type or 'image/png')

@router.post('/task/{task_id}/complete')
async def complete_task(task_id: str, payload: CompleteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    tr = db.query(TaskRun).filter(TaskRun.task_id == task_id).first()
    if not tr:
        tr = TaskRun(task_id=task_id, created_at=datetime.now(timezone.utc))
        db.add(tr)
        db.flush()
    tr.status = payload.status
    tr.result = payload.result
    tr.finished_at = datetime.now(timezone.utc)
    db.commit()
    return {'ok': True}

@router.get('/summary')
async def workflows_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    total = db.query(TaskRun).count()
    success = db.query(TaskRun).filter(TaskRun.status == 'success').count()
    failed = db.query(TaskRun).filter(TaskRun.status == 'failed').count()
    pending = db.query(TaskRun).filter(TaskRun.status.in_(['pending', 'queued', 'running'])).count()
    return {
        'total': total,
        'success': success,
        'failed': failed,
        'pending': pending,
    }

@router.get('/recent')
async def workflows_recent(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(TaskRun).order_by(TaskRun.created_at.desc()).limit(10).all()
    def stringify(res: Any) -> str:
        if isinstance(res, dict):
            if 'status' in res:
                return str(res['status'])
            return JSONString(res)
        return str(res or '')
    def JSONString(d: Dict[str, Any]) -> str:
        import json
        try:
            return json.dumps(d)
        except Exception:
            return str(d)
    return [
        {
            'id': r.task_id,
            'workflow_type': (r.result or {}).get('action', 'workflow') if isinstance(r.result, dict) else 'workflow',
            'status': r.status,
            'created_at': (r.created_at or datetime.now(timezone.utc)).isoformat(),
            'result': stringify(r.result),
        }
        for r in rows
    ]

@router.get('/history')
async def workflows_history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(TaskRun).order_by(TaskRun.created_at.desc()).all()
    def stringify(res: Any) -> str:
        if isinstance(res, dict):
            if 'status' in res:
                return str(res['status'])
            return JSONString(res)
        return str(res or '')
    def JSONString(d: Dict[str, Any]) -> str:
        import json
        try:
            return json.dumps(d)
        except Exception:
            return str(d)
    return [
        {
            'id': r.task_id,
            'workflow_type': (r.result or {}).get('action', 'workflow') if isinstance(r.result, dict) else 'workflow',
            'status': r.status,
            'created_at': (r.created_at or datetime.now(timezone.utc)).isoformat(),
            'result': stringify(r.result),
        }
        for r in rows
    ]
