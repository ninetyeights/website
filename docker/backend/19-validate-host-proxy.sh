#!/bin/sh
set -eu
# Nginx also accepts networks and names; this project permits one literal IP only.
if ! printf '%s\n' "${HOST_PROXY_IP:-}" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$|^[0-9A-Fa-f]*:[0-9A-Fa-f:]+$'; then
    echo 'HOST_PROXY_IP must be one literal IPv4 or IPv6 address, without CIDR or wildcards.' >&2
    exit 1
fi
