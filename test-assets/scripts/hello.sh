#!/usr/bin/env bash
# ============================================================================
# BigDeck "run script" test — shell
#
# BigDeck runs scripts DETACHED and discards stdout, so this script proves
# execution with a side effect: it appends a timestamped line to ran.log
# next to itself. After pressing the key, `cat ran.log` (or ask the agent)
# to confirm the run.
# ============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

{
  echo "$(date '+%Y-%m-%d %H:%M:%S') | bash  | pid=$$ | args: $*"
} >> "$DIR/ran.log"

echo "hello from BigDeck (bash) — logged to ran.log"
