from celery import Celery
from app.config import REDIS_URL

celery_client = Celery('backend_client', broker=REDIS_URL, backend=REDIS_URL)

def enqueue_workflow(workflow_id: int, params: dict, user_id: int = None):
    async_result = celery_client.send_task(
        'worker.tasks.run_workflow_task',
        args=(workflow_id, user_id, params),
        queue='workers'
    )
    return async_result.id
