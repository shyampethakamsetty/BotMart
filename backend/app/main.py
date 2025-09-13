from fastapi import FastAPI
from app.routers import auth, workflows
from fastapi.staticfiles import StaticFiles
app = FastAPI(title='Ecomm Orchestrator (backend)')
app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(workflows.router, prefix='/api/workflows', tags=['workflows'])

# Serve screenshots from shared volume
app.mount('/api/static/screenshots', StaticFiles(directory='/data/screenshots'), name='screenshots')

@app.get('/health')
async def health():
    return {'status':'ok'}
