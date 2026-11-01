#!/bin/bash
# Installs Learn Thai on a Mac and starts it. Paste this into Terminal:
#
#   curl -fsSL https://raw.githubusercontent.com/AlexBangkok83/sofias-wonderworld/ccr-eb9708e9-feko08/scripts/setup-mac.sh | bash
#
# What it does, skipping anything that is already done:
#   1. installs Node.js 22 from nodejs.org if it is missing or too old (asks for your Mac password)
#   2. downloads the project into the thai-learning folder (on the Desktop unless you have one elsewhere)
#   3. installs its packages (npm install)
#   4. writes .env.local with your OpenAI key and a family passcode, for talking with Khru Mali
#   5. puts a "Learn Thai" shortcut on the Desktop and starts the app in your browser
#
# Run it again any time to update to the latest version. Settings and Sofia's progress are kept
# (progress lives in the browser, not in this folder).
#
# Options (environment variables):
#   LEARN_THAI_DIR=/some/folder   install there instead
#   LEARN_THAI_NO_START=1         set everything up but don't start the app

set -euo pipefail

REPO="AlexBangkok83/sofias-wonderworld"
BRANCH="ccr-eb9708e9-feko08"
NODE_LINE="latest-v22.x"

say() { printf '\n\033[1;35m▸ %s\033[0m\n' "$1"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die() { printf '\n\033[31m✗ %s\033[0m\n\n' "$1" >&2; exit 1; }

# Questions are read from the keyboard even when this script arrives through a pipe.
can_ask() { [ -r /dev/tty ] && (: </dev/tty) 2>/dev/null; }

node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  # Vite needs Node 20.19+ or 22.12+.
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)||(a===20&&b>=19)?0:1)' 2>/dev/null
}

set_env() { # set_env NAME value: replaces the line in .env.local, or adds it
  local tmpf
  tmpf=$(mktemp)
  if grep -q "^$1=" .env.local; then
    awk -v k="$1" -v v="$2" 'index($0, k "=") == 1 { print k "=" v; next } { print }' .env.local >"$tmpf"
  else
    cat .env.local >"$tmpf"
    printf '%s=%s\n' "$1" "$2" >>"$tmpf"
  fi
  mv "$tmpf" .env.local
  chmod 600 .env.local
}

main() {
# ───────────────────────── 1. Node.js ─────────────────────────

say "Checking Node.js"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if node_ok; then
  ok "Node.js $(node --version) is installed"
else
  [ "$(uname)" = "Darwin" ] || die "Node.js 22 is needed. Install it from https://nodejs.org and run this again."
  pkg=$(curl -fsSL "https://nodejs.org/dist/$NODE_LINE/SHASUMS256.txt" | awk '/\.pkg$/ {print $2}')
  [ -n "$pkg" ] || die "Could not find the Node.js installer on nodejs.org. Check the internet connection and try again."
  say "Installing Node.js (${pkg%.pkg}). Your Mac will ask for your password."
  tmp=$(mktemp -d)
  curl -fL --progress-bar -o "$tmp/$pkg" "https://nodejs.org/dist/$NODE_LINE/$pkg"
  sudo installer -pkg "$tmp/$pkg" -target / >/dev/null
  rm -rf "$tmp"
  hash -r
  node_ok || die "Node.js did not install. Install it from https://nodejs.org and run this again."
  ok "Node.js $(node --version) installed"
fi

# ───────────────────────── 2. The project ─────────────────────────

say "Getting Learn Thai"
if [ -n "${LEARN_THAI_DIR:-}" ]; then
  base="$LEARN_THAI_DIR"
else
  # An existing thai-learning folder, else a new one on the Desktop.
  base="$HOME/Desktop/thai-learning"
  for place in "$HOME/Desktop" "$HOME" "$HOME/Documents" "$HOME/Developer" "$HOME/Projects"; do
    if [ -d "$place/thai-learning" ]; then base="$place/thai-learning"; break; fi
  done
fi
mkdir -p "$base"

# The project goes straight into the folder if it is empty or already holds it,
# otherwise into a sofias-wonderworld folder inside it.
if [ -f "$base/package.json" ] || [ -z "$(ls -A "$base" 2>/dev/null | grep -v '^\.DS_Store$' || true)" ]; then
  dir="$base"
else
  dir="$base/sofias-wonderworld"
fi
mkdir -p "$dir"
cd "$dir"

if [ -d .git ]; then
  git fetch --quiet origin "$BRANCH" && git checkout --quiet "$BRANCH" && git merge --quiet --ff-only "origin/$BRANCH" \
    || die "Could not update with git in $dir. Your own changes there may be in the way."
  ok "Updated to the latest version (git)"
elif [ ! -f package.json ] && [ "$(uname)" = "Darwin" ] && xcode-select -p >/dev/null 2>&1 && git --version >/dev/null 2>&1; then
  # git is already set up on this Mac: clone, so later runs update with a quick pull.
  git init --quiet
  git remote add origin "https://github.com/$REPO.git"
  git fetch --quiet --depth 1 origin "$BRANCH"
  git checkout --quiet -B "$BRANCH" FETCH_HEAD
  git branch --quiet --set-upstream-to "origin/$BRANCH" 2>/dev/null || true
  ok "Downloaded into $dir"
else
  # No git needed: download the files. Keeps .env.local and node_modules.
  tmp=$(mktemp -d)
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH" | tar -xz -C "$tmp" --strip-components 1
  [ -f "$tmp/package.json" ] || die "The download did not work. Check the internet connection and try again."
  cp -R "$tmp"/. "$dir"/
  rm -rf "$tmp"
  ok "Downloaded into $dir"
fi

# ───────────────────────── 3. Packages ─────────────────────────

say "Installing packages (a minute or two the first time)"
npm install --no-audit --no-fund --no-update-notifier --loglevel=error
ok "Packages installed"

# ───────────────────────── 4. Talking with Khru Mali ─────────────────────────

say "Setting up talking with Khru Mali"
[ -f .env.local ] || cp .env.example .env.local
current_key=$(sed -n 's/^OPENAI_API_KEY=//p' .env.local | head -n 1)


if [ -n "$current_key" ]; then
  ok "Your OpenAI key is already in .env.local"
elif can_ask; then
  echo "  Talking needs an OpenAI API key (platform.openai.com → API keys). Everything else works without one."
  printf '  Paste your OpenAI key and press Enter (or just press Enter to skip): '
  read -r -s key </dev/tty || key=""
  echo
  key=$(printf '%s' "$key" | tr -d '[:space:]')
  if [ -n "$key" ]; then
    set_env OPENAI_API_KEY "$key"
    ok "Key saved in $dir/.env.local (only on this Mac)"
  else
    echo "  Skipped. To add it later, open $dir/.env.local in TextEdit and fill in OPENAI_API_KEY."
  fi
else
  echo "  Add your OpenAI key later in $dir/.env.local (OPENAI_API_KEY=...)."
fi

current_code=$(sed -n 's/^CHAT_PASSCODE=//p' .env.local | head -n 1)
if [ -n "$current_code" ]; then
  ok "Family passcode is already set"
elif can_ask; then
  printf '  Pick a family passcode, any word (you type it once in the app: Grown-ups → Talk): '
  read -r code </dev/tty || code=""
  code=$(printf '%s' "$code" | tr -d '[:space:]')
  [ -n "$code" ] || code="sofia"
  set_env CHAT_PASSCODE "$code"
  ok "Family passcode: $code"
else
  set_env CHAT_PASSCODE "sofia"
  ok "Family passcode: sofia (change it in $dir/.env.local)"
fi

# ───────────────────────── 5. Shortcut and start ─────────────────────────

if [ "$(uname)" = "Darwin" ] && [ -d "$HOME/Desktop" ]; then
  launcher="$HOME/Desktop/Learn Thai.command"
  cat >"$launcher" <<EOF
#!/bin/bash
# Starts Learn Thai and opens it in the browser. Close this window to stop it.
export PATH="/usr/local/bin:/opt/homebrew/bin:\$PATH"
cd "$dir" || exit 1
npm start
EOF
  chmod +x "$launcher"
  ok "Shortcut on the Desktop: double-click \"Learn Thai\" to start it next time"
fi

printf '\n\033[1;32m  All set.\033[0m Learn Thai is in %s\n' "$dir"
printf '  It opens at http://localhost:5173/thai/  (leave this window open while Sofia plays; close it to stop)\n\n'

if [ -z "${LEARN_THAI_NO_START:-}" ]; then
  if can_ask; then exec npm start </dev/tty; else exec npm start; fi
fi
}

main "$@"
