#!/bin/sh
# Lists armel commits touching uvstudio/ that the fork hasn't merged yet, per branch.
# Local master in ../armel.github.io marks the last sync (see "Sync with" in CLAUDE.md).
cd "$(dirname "$0")/../../armel.github.io" || exit 1
git fetch -q --prune origin
for b in $(git branch -r --format='%(refname:short)' | grep -v -e HEAD -e '^origin$'); do
  log=$(git log --oneline master.."$b" -- uvstudio/)
  [ -n "$log" ] && printf '== %s\n%s\n' "$b" "$log"
done
exit 0
