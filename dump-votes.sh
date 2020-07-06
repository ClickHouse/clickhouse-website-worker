#!/usr/bin/env bash

# Configure wrangler before the first run: https://developers.cloudflare.com/workers/tooling/wrangler/

KEYS=$(wrangler kv:key list -b RATING -e production | json_pp | awk '$1 ~ /"name"/ {print $3;}' | tr -d '"')
for KEY in KEYS
do
    echo -n "${key} "
    wrangler kv:key get -b RATING -e production "${key}"
    echo ''
done
