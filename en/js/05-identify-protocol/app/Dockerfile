FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app /app

# Set environment variables for timeout and log file
ARG TIMEOUT_DURATION=30s
ENV TIMEOUT_DURATION=${TIMEOUT_DURATION}
ARG REMOTE_PEERS
ENV REMOTE_PEERS=${REMOTE_PEERS}

# Run with timeout and redirect output to mounted log file
CMD ["/bin/sh", "-c", "timeout ${TIMEOUT_DURATION} node index.js > /app/stdout.log 2>&1"]