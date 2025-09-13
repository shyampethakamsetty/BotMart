from celery import Celery
from celery.result import AsyncResult
from app.config import REDIS_URL

celery_client = Celery('backend_client', broker=REDIS_URL, backend=REDIS_URL)


def enqueue_workflow(workflow_id: int, params: dict, user_id: int = None):
    async_result = celery_client.send_task(
        'worker.tasks.run_workflow_task',
        args=(workflow_id, user_id, params),
        queue='workers'
    )
    return async_result.id


def get_task_status(task_id: str) -> dict:
    result = AsyncResult(task_id, app=celery_client)
    status = (result.status or '').upper()
    normalized = {
        'PENDING': 'pending',
        'RECEIVED': 'queued',
        'STARTED': 'running',
        'RETRY': 'retry',
        'SUCCESS': 'success',
        'FAILURE': 'failed',
    }.get(status, status.lower())

    payload = {
        'id': task_id,
        'status': normalized,
        'result': '',
        'screenshots': [],
        'logs': [],
    }

    if result.successful():
        try:
            payload['result'] = result.get(propagate=False)  # worker returns dict
        except Exception:
            payload['result'] = 'Completed'
    elif result.failed():
        try:
            payload['result'] = str(result.result)
        except Exception:
            payload['result'] = 'Failed'

    return payload
