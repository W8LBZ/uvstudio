#!/bin/sh
# Trial-merges armel's latest uvstudio/ into the current checkout and prints a Markdown report:
# what upstream changed, which files conflict, and whether the tests and smoke tests pass.
# Run in a scratch checkout (CI or a git worktree): it leaves the merge in the working tree.
# Conflicted hunks keep our side (-X ours), so the tests then run without upstream's version of them.
# Usage: CHROME=<chrome> tools/upstream-trial.sh <armel.github.io clone>
armel=$1
out=${RUNNER_TEMP:-/tmp}/upstream-trial
mkdir -p "$out"
git -C "$armel" subtree split -q --prefix=uvstudio -b uvstudio-trial >/dev/null
git fetch -q "$armel" uvstudio-trial
git -C "$armel" branch -q -D uvstudio-trial
base=$(git merge-base HEAD FETCH_HEAD)

echo "### Shape"
echo
git diff --shortstat "$base" FETCH_HEAD
added=$(git diff --name-only --diff-filter=A "$base" FETCH_HEAD)
[ -n "$added" ] && printf '\nNew files: %s\n' "$(echo $added)"
keys=$(git diff "$base" FETCH_HEAD -- locales/en.js | grep -c '^+  "')
echo "New or changed English strings: $keys"
echo
echo '<details><summary>Files</summary>'
echo
echo '```'
git diff --stat=100 "$base" FETCH_HEAD | sed '$d'
echo '```'
echo '</details>'
echo

echo "### Trial merge into $(git rev-parse --abbrev-ref HEAD) ($(git rev-parse --short HEAD))"
echo
git -c user.name=ci -c user.email=ci@localhost merge -q --no-commit --no-ff FETCH_HEAD >/dev/null 2>&1
conflicts=$(git diff --name-only --diff-filter=U)
if [ -n "$conflicts" ]; then
  echo "Conflicts (hunks per file), mostly expected for ?v= cache keys:"
  for f in $conflicts; do echo "- $f ($(grep -c '^<<<<<<<' "$f"))"; done
  git merge --abort
  git -c user.name=ci -c user.email=ci@localhost merge -q --no-commit --no-ff -X ours FETCH_HEAD >/dev/null 2>&1
  echo
  echo "Tests below ran with those hunks keeping our side."
else
  echo "Merges cleanly."
fi
echo

node --test --test-reporter=spec tests/*.test.js >"$out/tests.txt" 2>&1
echo "Unit tests: $(grep -E '^ℹ (pass|fail) ' "$out/tests.txt" | tr '\n' ' ' | sed 's/ℹ //g')"
grep '^✖' "$out/tests.txt" | grep -v 'failing tests' | sed -E 's/ \([0-9.]+ms\)$//; s/^/- /' | sort -u
for size in desktop phone; do
  mkdir -p "$out/$size"
  if [ $size = phone ]; then m=1; else m=; fi
  if MOBILE=$m node tools/smoke.js index.html "$out/$size" >"$out/smoke-$size.txt" 2>&1; then
    echo "Smoke test ($size): passed"
  else
    echo "Smoke test ($size): FAILED: $(grep -v '^ *at ' "$out/smoke-$size.txt" | tail -3 | tr '\n' ' ')"
  fi
done
