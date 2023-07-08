#!/bin/sh
"$(dirname "$0")/unignored-files.sh" \
  | sort \
  | sed -E 's/.*/sha1sum '"'&'"'/g' \
  | sh \
  | sha1sum \
  | sed -E 's/([^ ]*).*/\1/g'
