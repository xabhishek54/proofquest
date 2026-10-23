FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for Lean 4, Node.js and building
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    build-essential \
    zstd \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user
RUN useradd -m -s /bin/bash proofquest
USER proofquest
ENV HOME=/home/proofquest
WORKDIR /home/proofquest/app

# Install elan and Lean 4 toolchain
ENV PATH="/home/proofquest/.elan/bin:${PATH}"
RUN curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain leanprover/lean4:v4.16.0

# Copy application files
COPY --chown=proofquest:proofquest . .

# Build Lean 4 library
WORKDIR /home/proofquest/app/lean
RUN lake build

# Build client
WORKDIR /home/proofquest/app/client
RUN npm install && npm run build

# Build server
WORKDIR /home/proofquest/app/server
RUN npm install && npm run build

# Working directory for running
WORKDIR /home/proofquest/app
ENV PORT=3001
ENV LEAN_DIR=/home/proofquest/app/lean
ENV ELAN_BIN_DIR=/home/proofquest/.elan/bin
EXPOSE 3001

CMD ["node", "server/dist/server.js"]
