import os
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:postgres@postgres:5432/ecommdb')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret')
