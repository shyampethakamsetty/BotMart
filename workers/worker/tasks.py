from workers.celery_app import celery_app
from .playwright_runner import PlaywrightRunner
from celery.utils.log import get_task_logger
import os
import base64
import requests
logger = get_task_logger(__name__)

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://backend:8000')
AUTH_TOKEN = os.environ.get('BACKEND_TOKEN', 'demo-token')
SESSION = requests.Session()
SESSION.headers.update({'Authorization': f'Bearer {AUTH_TOKEN}'})

@celery_app.task(name='worker.tasks.run_workflow_task', bind=True)
def run_workflow_task(self, workflow_id, user_id, params):
    logger.info(f"Running workflow {workflow_id} for user {user_id} with params {params}")

    task_id = getattr(self.request, 'id', None) or 'unknown'
    runner = PlaywrightRunner(headless=True)
    result = runner.run_workflow(workflow_id, user_id, params or {}, screenshot_dir=None)

    # Upload screenshots bytes to backend
    shots = result.get('screenshots_bytes') or []
    for idx, (filename, png_bytes) in enumerate(shots):
        try:
            payload = {
                'filename': filename,
                'data_base64': base64.b64encode(png_bytes).decode('utf-8'),
                'content_type': 'image/png',
                'step_index': idx,
            }
            url = f"{BACKEND_URL}/api/workflows/task/{task_id}/screenshots"
            r = SESSION.post(url, json=payload, timeout=30)
            r.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to upload screenshot {filename}: {e}")

    # Decide success/failure: fail only if explicit error present
    is_failed = bool(result.get('error')) or result.get('status') == 'error'
    final_status = 'failed' if is_failed else 'success'

    # Mark completion in backend
    try:
        comp = {
            'status': final_status,
            'result': {k: v for k, v in result.items() if k not in ('screenshots', 'screenshots_bytes')},
        }
        url = f"{BACKEND_URL}/api/workflows/task/{task_id}/complete"
        r = SESSION.post(url, json=comp, timeout=30)
        r.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to mark task complete: {e}")

    logger.info(f"Workflow result: {result}")
    return {'status': final_status}
