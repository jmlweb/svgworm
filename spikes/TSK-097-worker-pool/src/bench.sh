#!/bin/sh
# usage: sh src/bench.sh <lucideIconDir> <tablerOutlineDir>
# Median of 5 cold runs per cell. Needs `pnpm build` at the repo root first.
LUCIDE=$1
TABLER=$2
median() { tr ' ' '\n' | sort -n | sed -n 3p; }
printf 'icons\tw0\tw2\tw4\tw2+main\tw4+main\n'
for spec in "$LUCIDE 20" "$LUCIDE 300" "$LUCIDE 1500" "$TABLER 5000"; do
  set -- $spec
  row="$2"
  for w in 0 2 4; do
    t=$(for i in 1 2 3 4 5; do node src/run.mjs "$1" "$2" "$w"; done | median)
    row="$row\t$t"
  done
  for w in 2 4; do
    t=$(for i in 1 2 3 4 5; do WITH_MAIN=1 node src/run.mjs "$1" "$2" "$w"; done | median)
    row="$row\t$t"
  done
  printf "$row\n"
done
