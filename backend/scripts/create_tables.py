from backend.app.models.base import Base
from backend.app.models.models import *
from backend.app.deps import engine
print('Creating tables...')
Base.metadata.create_all(bind=engine)
print('Done.')
