#!/usr/bin/env bash
# ============================================================
# Mobitech SIM Dashboard — Production Deploy Script
# ============================================================
set -euo pipefail

# ---------- colours / helpers ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No colour

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }
divider(){ echo -e "${CYAN}──────────────────────────────────────────────${NC}"; }

# ---------- configurable defaults ----------
GITHUB_USER="ndoroe"
GITHUB_REPO="Mobitech-Dashboard"
DEPLOY_DIR="/root/mobitech/sim-dashboard"
ENV_FILE="${DEPLOY_DIR}/.env"
SCHEMA_FILE="${DEPLOY_DIR}/server/Schema.sql"
PM2_APP_NAME="mobitech-sim-dashboard"

# ---------- pre-flight checks ----------
for cmd in node npm pm2 mysql git; do
  if ! command -v "$cmd" &>/dev/null; then
    err "'$cmd' is required but not found. Please install it first."
    exit 1
  fi
done

divider
echo -e "${GREEN} Mobitech SIM Dashboard — Deploy to Production${NC}"
divider
echo ""

# ======================================================
# 1. Choose source: local copy or GitHub
# ======================================================
info "Where should the code come from?"
echo "  1) Local repository (current working copy)"
echo "  2) GitHub  (${GITHUB_USER}/${GITHUB_REPO})"
echo ""
read -rp "Select [1/2]: " SOURCE_CHOICE

case "$SOURCE_CHOICE" in
  1)
    LOCAL_REPO="$(cd "$(dirname "$0")" && pwd)"
    info "Using local repo at: ${LOCAL_REPO}"

    # Sync local -> deploy dir
    if [[ "$LOCAL_REPO" != "$DEPLOY_DIR" ]]; then
      info "Syncing files to ${DEPLOY_DIR} ..."
      mkdir -p "$DEPLOY_DIR"
      rsync -a --delete \
        --exclude node_modules \
        --exclude .git \
        --exclude logs \
        --exclude 'server/node_modules' \
        "${LOCAL_REPO}/" "${DEPLOY_DIR}/"
      ok "Files synced."
    else
      ok "Already in deploy directory."
    fi
    ;;
  2)
    echo ""
    read -rsp "Enter your GitHub Personal Access Token (PAT): " GITHUB_PAT
    echo ""

    if [[ -z "$GITHUB_PAT" ]]; then
      err "PAT cannot be empty."
      exit 1
    fi

    CLONE_URL="https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"

    # Verify access before proceeding
    info "Verifying GitHub access ..."
    if ! git ls-remote "$CLONE_URL" HEAD &>/dev/null; then
      err "Could not authenticate with GitHub. Check your PAT and repo name."
      exit 1
    fi
    ok "GitHub access verified."

    read -rp "Branch to deploy [main]: " GIT_BRANCH
    GIT_BRANCH="${GIT_BRANCH:-main}"

    if [[ -d "${DEPLOY_DIR}/.git" ]]; then
      info "Pulling latest from ${GIT_BRANCH} ..."
      cd "$DEPLOY_DIR"
      git remote set-url origin "$CLONE_URL"
      git fetch origin
      git checkout "$GIT_BRANCH"
      git reset --hard "origin/${GIT_BRANCH}"
      ok "Repository updated."
    else
      info "Cloning repository ..."
      mkdir -p "$(dirname "$DEPLOY_DIR")"
      git clone -b "$GIT_BRANCH" "$CLONE_URL" "$DEPLOY_DIR"
      ok "Repository cloned."
    fi

    # Clear PAT from memory / remote URL after clone
    cd "$DEPLOY_DIR"
    git remote set-url origin "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
    unset GITHUB_PAT CLONE_URL
    ;;
  *)
    err "Invalid choice. Exiting."
    exit 1
    ;;
esac

cd "$DEPLOY_DIR"
divider

# ======================================================
# 2. Set application version
# ======================================================
CURRENT_VERSION=$(grep -oP '(?<="version": ")[^"]+' package.json 2>/dev/null || echo "unknown")
info "Current app version: ${CURRENT_VERSION}"
read -rp "Enter new version (leave blank to keep ${CURRENT_VERSION}): " NEW_VERSION
NEW_VERSION="${NEW_VERSION:-$CURRENT_VERSION}"

# Update version in package.json
if [[ "$NEW_VERSION" != "$CURRENT_VERSION" ]]; then
  sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json
  ok "package.json version → ${NEW_VERSION}"
fi

# ======================================================
# 3. Configure .env for production
# ======================================================
echo ""
if [[ -f "$ENV_FILE" ]]; then
  info "Existing .env found — updating production values ..."
else
  warn "No .env file found at ${ENV_FILE}."
  info "Creating from template — you MUST edit secrets afterwards."
  cat > "$ENV_FILE" <<'ENVEOF'
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=edron
DB_PASSWORD=CHANGE_ME
DB_NAME=Mobitech

# JWT
JWT_SECRET=CHANGE_ME_TO_A_STRONG_RANDOM_SECRET
JWT_EXPIRE=7d

# CORS — set to your production domain(s)
CORS_ORIGIN=https://yourdomain.com

# Frontend URL (used in emails)
FRONTEND_URL=https://yourdomain.com

# Trust proxy (set true if behind Nginx / Cloudflare)
TRUST_PROXY=true

# Logging
LOG_FORMAT=combined

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@email.com
EMAIL_PASS=CHANGE_ME
EMAIL_FROM=admin@yourdomain.com
EMAIL_FROM_NAME=SIM Dashboard Admin
ENVEOF
fi

# Always force production mode and version in .env
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$ENV_FILE"

if grep -q "^REACT_APP_VERSION=" "$ENV_FILE"; then
  sed -i "s/^REACT_APP_VERSION=.*/REACT_APP_VERSION=${NEW_VERSION}/" "$ENV_FILE"
else
  echo "REACT_APP_VERSION=${NEW_VERSION}" >> "$ENV_FILE"
fi

ok ".env set to NODE_ENV=production, version=${NEW_VERSION}"
divider

# ======================================================
# 4. Run database schema migrations
# ======================================================
info "Running Schema.sql for database changes ..."

if [[ ! -f "$SCHEMA_FILE" ]]; then
  err "Schema file not found at ${SCHEMA_FILE}. Skipping DB migration."
else
  # Read DB credentials from .env
  DB_HOST=$(grep '^DB_HOST=' "$ENV_FILE" | cut -d'=' -f2-)
  DB_PORT=$(grep '^DB_PORT=' "$ENV_FILE" | cut -d'=' -f2-)
  DB_USER=$(grep '^DB_USER=' "$ENV_FILE" | cut -d'=' -f2-)
  DB_PASS=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)
  DB_NAME=$(grep '^DB_NAME=' "$ENV_FILE" | cut -d'=' -f2-)

  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SCHEMA_FILE" 2>&1; then
    ok "Schema.sql executed successfully."
  else
    warn "Schema.sql had warnings (tables may already exist). Check above output."
  fi
fi
divider

# ======================================================
# 5. Install dependencies
# ======================================================
info "Installing root (frontend) dependencies ..."
npm ci --legacy-peer-deps --production=false 2>&1 | tail -1
ok "Root dependencies installed."

info "Installing server dependencies ..."
cd server
npm ci --production 2>&1 | tail -1
cd ..
ok "Server dependencies installed."
divider

# ======================================================
# 6. Build React frontend
# ======================================================
info "Building React frontend for production ..."
npm run build
ok "Frontend build complete → ${DEPLOY_DIR}/build/"
divider

# ======================================================
# 7. Start / restart with PM2
# ======================================================
info "Starting application with PM2 ..."

if pm2 describe "$PM2_APP_NAME" &>/dev/null; then
  info "Existing PM2 process found — restarting ..."
  pm2 restart ecosystem.config.js --env production
else
  info "No existing PM2 process — starting fresh ..."
  pm2 start ecosystem.config.js --env production
fi

# Save PM2 process list so it survives reboots
pm2 save

ok "PM2 process '${PM2_APP_NAME}' is running."
divider

# ======================================================
# 8. Post-deploy health check
# ======================================================
info "Waiting 5 seconds for server to start ..."
sleep 5

PORT=$(grep '^PORT=' "$ENV_FILE" | cut -d'=' -f2- || echo "5000")
PORT="${PORT:-5000}"

if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
  ok "Health check passed! Server is responding on port ${PORT}."
else
  warn "Health check failed. Check logs with: pm2 logs ${PM2_APP_NAME}"
fi

divider
echo ""
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "  Version : ${NEW_VERSION}"
echo -e "  Mode    : production"
echo -e "  PM2     : pm2 status / pm2 logs ${PM2_APP_NAME}"
echo -e "  Health  : curl http://localhost:${PORT}/health"
echo ""
divider
