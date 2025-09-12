from fastapi import FastAPI
from app.routers import auth, workflows
app = FastAPI(title='Ecomm Orchestrator (backend)')
app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(workflows.router, prefix='/api/workflows', tags=['workflows'])

@app.get('/health')
async def health():
    return {'status':'ok'}
