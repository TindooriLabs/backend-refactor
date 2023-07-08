#!/bin/sh
[ "$("$(dirname "$0")/get-hash.sh")" == "$(<.file_hash)" ]
