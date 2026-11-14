FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential default-libmysqlclient-dev pkg-config libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt
COPY . .
RUN DJANGO_SECRET_KEY=build-only DB_ENGINE=sqlite python manage.py collectstatic --noinput --settings=config.settings.local
RUN useradd -m app && chown -R app /app
USER app
EXPOSE 8000
# Async-capable server: gunicorn manages processes, each worker runs an event loop.
CMD ["gunicorn", "config.asgi:application", "-k", "uvicorn_worker.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "--timeout", "60"]
