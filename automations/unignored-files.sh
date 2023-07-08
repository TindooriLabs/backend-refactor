#!/bin/sh
FILES="$( \
  find . -depth 1 \
  | sed -e '/\/\.git/d' -e '/\/node_modules/d' \
      -e 's/.*/find '"'&'"' -type f/' \
  | sh \
)"
# >&2 echo debug: $FILES

HUGE_SED_COMMAND="$( \
  echo '/^('$( \
    git check-ignore --stdin <<<"$FILES" \
    | sed 's/\./\\./g; s/\//\\\//g' \
    )')$/d' \
  | sed 's/ /|/g' \
)"
# >&2 echo debug: $HUGE_SED_COMMAND

sed -E "${HUGE_SED_COMMAND}" <<<"$FILES"
