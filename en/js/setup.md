## 0. **Quick Start Setup**

Run the setup script once before starting lessons:

```bash
cd en/js
./setup-workshop.sh
```

This script will:
- ✅ Create the Docker network (`workshop-net`)
- ✅ Build the unified checker image
- ✅ Set up checker keys directory
- ✅ Configure environment variables

**Alternative manual setup:**

If you prefer manual setup:

```bash
# Create shared docker network
docker network create --subnet=172.16.16.0/24 --gateway=172.16.16.1 workshop-net

# Build unified checker image
cd en/checker
docker build -t ghcr.io/libp2p/universal-connectivity-workshop/ucw-checker-en:latest .

# Set environment variables (adjust paths as needed)
export WORKSHOP_ROOT="$(pwd)/../.."
export PROJECT_ROOT="$WORKSHOP_ROOT"
export CHECKER_KEY_PATH="$WORKSHOP_ROOT/en/checker/keys/checker.key"
# lesson 07 only
export CHECKER1_KEY_PATH="$WORKSHOP_ROOT/en/checker/keys/checker1.key"
export CHECKER2_KEY_PATH="$WORKSHOP_ROOT/en/checker/keys/checker2.key"
```

**Note:** Place checker key files at `en/checker/keys/`. The setup script will attempt to copy them from Rust lessons if available. If these env vars are not set, lessons fall back to local default key filenames.

## 1. **Prerequisites**

### Tool
- Node (≥ 18 LTS )            
- npm (≥ 9 )               
- TypeScript (optional) (≥ 5.4 )
- Docker and Docker Compose

## 2. **Project Setup**

This workshop is part of the universal-connectivity-workshop repository. Clone it:

```bash
git clone <repository-url>
cd universal-connectivity-workshop
```

## 3. **Install Dependencies**

Each lesson has its own `app/package.json`. Dependencies are installed during Docker build, but for local development:

```bash
cd en/js/01-identity-and-swarm/app
npm install
```

## 4. **Running Lessons**

### Run All Lessons Sequentially

```bash
cd en/js
./run-all-lessons.sh
```

This script runs all 8 lessons in order, validates each one, and cleans up after each lesson.

### Run Individual Lessons

```bash
# Set environment variables (if not already set)
export PROJECT_ROOT="$(pwd)/../.."
export LESSON_PATH="en/js/01-identity-and-swarm"

# Navigate to lesson directory
cd en/js/01-identity-and-swarm

# Build and start
docker compose up -d --build

# Run checks
python3 check.py

# Clean up
docker compose down -v
```

### Lesson-Specific Notes

- **Lesson 01**: No checker needed, validates local identity. Requires `PROJECT_ROOT` and `LESSON_PATH` env vars.
- **Lesson 04**: Circuit relay uses multiple services, check.py needs log file paths:
  ```bash
  python3 check.py --relay-log relay.log --listener-log listener.log --dialer-log dialer.log --relay-peerid-json app/peer-id.json
  ```
- **Lessons 02, 03, 05, 06, 08**: Use unified checker, check.py reads checker.log (CSV format)
- **Lesson 07**: Uses two checker instances (checker-01 and checker-02) for Kademlia bootstrap

### Troubleshooting

**Network conflicts:**
```bash
# Remove old networks if needed
docker network rm $(docker network ls -q --filter name=workshop) 2>/dev/null || true
# Recreate
docker network create --subnet=172.16.16.0/24 --gateway=172.16.16.1 workshop-net
```

**Checker image not found:**
```bash
# Build locally
cd en/checker
docker build -t ghcr.io/libp2p/universal-connectivity-workshop/ucw-checker-en:latest .
```

**Key files missing:**
- The setup script tries to copy keys from Rust lessons
- Or generate them using libp2p key generation tools
- Or use the default local key paths defined in each lesson's docker-compose.yaml