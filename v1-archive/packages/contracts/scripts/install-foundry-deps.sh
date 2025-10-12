#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ensure_dep() {
  local dir="$1"
  local source="$2"

  if [ -d "lib/$dir" ]; then
    if [ -n "$(ls -A "lib/$dir")" ]; then
      return
    fi
  fi

  forge install --no-git "$source"
}

ensure_dep "forge-std" "foundry-rs/forge-std@v1.9.7"
ensure_dep "openzeppelin-contracts" "OpenZeppelin/openzeppelin-contracts@v5.3.0"
ensure_dep "openzeppelin-contracts-upgradeable" "OpenZeppelin/openzeppelin-contracts-upgradeable@v5.4.0"
