# Use official Python runtime as a parent image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire src directory (which includes both backend and frontend)
COPY src ./src

# Move working directory to the backend so Uvicorn can find server.py
WORKDIR /app/src/backend

# Expose port (default is 8000, can be overridden by hosting platform)
EXPOSE 8000

# Run the FastAPI server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
