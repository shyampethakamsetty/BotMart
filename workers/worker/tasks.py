from workers.celery_app import celery_app
from .playwright_runner import PlaywrightRunner
from celery.utils.log import get_task_logger
logger = get_task_logger(__name__)

@celery_app.task(name='worker.tasks.run_workflow_task', bind=True)
def run_workflow_task(self, workflow_id, user_id, params):
    logger.info(f"Running workflow {workflow_id} for user {user_id} with params {params}")
    runner = PlaywrightRunner(headless=True)
    result = runner.run_workflow(workflow_id, user_id, params or {})
    logger.info(f"Workflow result: {result}")
    return result
