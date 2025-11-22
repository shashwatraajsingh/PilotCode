# Docker sandbox for safe code execution
FROM node:18-alpine

# Install common development tools
RUN apk add --no-cache \
    git \
    python3 \
    py3-pip \
    bash \
    curl \
    wget

# Install global npm packages
RUN npm install -g typescript ts-node nodemon

# Create workspace directory
WORKDIR /workspace

# Set up non-root user for security
RUN addgroup -g 1001 devin && \
    adduser -D -u 1001 -G devin devin

USER devin

CMD ["/bin/bash"]
