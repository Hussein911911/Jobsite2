FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ALFAYD_DB=/data/alfayd.db
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server ./server
COPY db ./db
COPY --from=frontend /app/dist ./dist
VOLUME ["/data"]
EXPOSE 8010
CMD ["python", "-m", "uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8010"]
