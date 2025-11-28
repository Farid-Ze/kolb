# Dockerfile for Python 3.13 Free-Threading (No-GIL)
# Multi-stage build for optimized image size

# ==========================================
# Stage 1: Builder
# ==========================================
FROM debian:bookworm-slim AS builder

ENV PYTHON_VERSION=3.13.0
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libncurses5-dev \
    libnss3-dev \
    libreadline-dev \
    libffi-dev \
    libsqlite3-dev \
    libbz2-dev \
    liblzma-dev \
    libpq-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (needed for pydantic-core compilation)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Download and build Python 3.13 with --disable-gil
RUN wget https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz \
    && tar -xf Python-${PYTHON_VERSION}.tgz \
    && cd Python-${PYTHON_VERSION} \
    && ./configure --disable-gil --enable-optimizations --with-ensurepip=install \
    && make -j$(nproc) \
    && make install \
    && cd .. \
    && rm -rf Python-${PYTHON_VERSION} Python-${PYTHON_VERSION}.tgz

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN python3.13t -m pip install --upgrade pip && \
    python3.13t -m pip install --no-cache-dir --prefix=/install -r requirements.txt

# ==========================================
# Stage 2: Runner
# ==========================================
FROM debian:bookworm-slim AS runner

ENV PYTHON_VERSION=3.13.0
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libssl3 \
    libpq5 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python installation from builder
COPY --from=builder /usr/local /usr/local

# Copy installed python packages
COPY --from=builder /install /usr/local

# Create symlinks
RUN ln -s /usr/local/bin/python3.13t /usr/local/bin/python-nogil

WORKDIR /app

# Copy application code
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY generate_openapi.py ./generate_openapi.py

EXPOSE 8000

# Run with uvicorn
CMD ["python3.13t", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
