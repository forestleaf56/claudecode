#!/usr/bin/env bash
# Publicerar senaste avanza_signals/index.html till grenen 'avanza-report' som EN
# enda foralderlos commit via force-push. Bara den senaste versionen finns kvar -
# ingen historik-anhopning (inte hundra gamla versioner). Kodgrenen paverkas inte.
set -euo pipefail

SRC="avanza_signals/index.html"
BR="avanza-report"

[ -f "$SRC" ] || { echo "saknar $SRC"; exit 1; }

# Bygg ett trad med bara index.html och en foralderlos commit - helt utan att
# rora arbetskatalogen eller den aktuella grenen:
BLOB=$(git hash-object -w "$SRC")
TREE=$(printf '100644 blob %s\tindex.html\n' "$BLOB" | git mktree)
COMMIT=$(git commit-tree "$TREE" -m "Avanza-rapport $(date -u '+%Y-%m-%d %H:%M UTC')")

# Force-push sa att grenen alltid har exakt EN commit med senaste rapporten:
git push -f origin "$COMMIT:refs/heads/$BR"
echo "Publicerade senaste index.html till '$BR' i detta repo (single commit)"

# Publicera aven till det separata 'avanza'-repot (main), samma single-commit.
AVANZA_URL="https://github.com/forestleaf56/avanza"
if git push -f "$AVANZA_URL" "$COMMIT:refs/heads/main"; then
  echo "Publicerade aven till $AVANZA_URL (main, single commit)"
else
  echo "VARNING: kunde inte pusha till $AVANZA_URL - kontrollera atkomst"
fi
