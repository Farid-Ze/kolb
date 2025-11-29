# Dockerfile for Python 3.11 (Standard/Stable)
# Replaces Python 3.13t (Free-Threading) due to async compatibility issues

# ==========================================
# Stage 1: Builder
# ==========================================
FROM python:3.11-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies
# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (needed for pydantic-core compilation if wheel missing)
# RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# ENV PATH="/root/.cargo/bin:${PATH}"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ==========================================
# Stage 2: Runner
# ==========================================
FROM python:3.11-slim-bookworm AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages
COPY --from=builder /install /usr/local

# Copy application code
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY generate_openapi.py ./generate_openapi.py

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Change ownership of the application directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8000

# Run with uvicorn in production mode
CMD ["python", "-m", "uvicorn", "app.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "4", \
    "--timeout-keep-alive", "30", \
    "--access-log", \
    "--log-level", "info"]
