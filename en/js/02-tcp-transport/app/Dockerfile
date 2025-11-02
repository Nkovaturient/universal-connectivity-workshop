FROM node:22-alpine AS builder

WORKDIR /app

# Accept the LESSON_PATH build arg
ARG LESSON_PATH

# Copy package.json from the correct subdirectory
COPY ${LESSON_PATH}/app/package*.json ./
RUN npm install

# Copy the rest of the app files
COPY ${LESSON_PATH}/app/ .

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app /app

ARG TIMEOUT_DURATION=20s
ENV TIMEOUT_DURATION=${TIMEOUT_DURATION}
ARG REMOTE_PEERS
ENV REMOTE_PEERS=${REMOTE_PEERS}

CMD ["/bin/sh", "-c", "node index.js > /app/stdout.log 2>&1"]