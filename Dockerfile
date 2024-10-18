FROM python:3.9.13

RUN mkdir /fastapi_app

WORKDIR /fastapi_app

COPY requirements .

RUN pip install -r requirements

COPY . .

CMD alembic upgrade head && gunicorn src.app:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:8080

