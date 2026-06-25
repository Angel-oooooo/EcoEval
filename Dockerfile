# Stage 1: compilar el frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: backend Python + frontend compilado
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend-builder /frontend/dist ./frontend/dist

CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
