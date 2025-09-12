FROM python:3.11-slim
WORKDIR /app
COPY workers/requirements.txt /app/requirements.txt
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libxss1 libgtk-3-0 libasound2 libgbm1 \
    fonts-liberation libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxrandr2 libxfixes3 libxrender1 libffi-dev curl build-essential \
    && pip install --no-cache-dir -r /app/requirements.txt \
    && playwright install chromium || true
COPY workers /app/workers
ENV PYTHONPATH=/app
CMD ["celery", "-A", "workers.celery_app.celery_app", "worker", "--loglevel=info", "-Q", "workers"]
