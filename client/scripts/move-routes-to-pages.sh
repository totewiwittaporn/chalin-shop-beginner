#!/usr/bin/env bash
set -e
SRC="${1:-src/routes}"
DST="${2:-src/pages}"
if [ -d "$DST" ]; then
  echo "Target $DST already exists. Aborting."
  exit 1
fi
if [ ! -d "$SRC" ]; then
  echo "Source $SRC not found. Aborting."
  exit 1
fi
mv "$SRC" "$DST"
echo "Renamed $SRC -> $DST"
