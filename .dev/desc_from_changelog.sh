#!/usr/bin/env bash
set -euo pipefail

VER="${1:-}"                          # e.g. 0.01 (no leading 'v' needed)
FILE="${2:-CHANGELOG.md}"
MAX="${MAX_DESC_CHARS:-512}"

[[ -f "$FILE" ]] || { echo ""; exit 0; }

awk -v ver="$VER" -v maxch="$MAX" '
  function trim(s){ sub(/^[ \t]+/,"",s); sub(/[ \t]+$/,"",s); return s }
  BEGIN{ want=ver; mode=0; n=0; first=""; }
  { sub(/\r$/, ""); }                           # strip CR if file is CRLF

  # 0 = searching for heading
  mode==0 {
    if (want != "") {
      if ($0 ~ "^###[[:space:]]*v?" want "([[:space:]]|\\)|$)") { mode=1; next }
    } else {
      if ($0 ~ /^###[[:space:]]*v?/) { mode=1; next }
    }
    next
  }

  # 1 = collecting content until next heading or blank paragraph end
  mode==1 {
    if ($0 ~ /^###[[:space:]]*v?/) { mode=2; next }         # next section
    if ($0 ~ /^[[:space:]]*$/ && (n>0 || first!="")) { mode=2; next }

    if ($0 ~ /^[[:space:]]*-/) {                            # bullet
      s=$0; sub(/^[[:space:]]*-[[:space:]]*/, "", s)
      s=trim(s); if (s!="") arr[++n]=s
      next
    }

    if (first=="") {                                        # first non-bullet line
      s=trim($0); if (s!="") first=s
    }
    next
  }

  END{
    out=""
    if (n>0) {
      for (i=1;i<=n;i++) out = (out=="" ? arr[i] : out " • " arr[i])
    } else if (first!="") {
      out = first
    }
    gsub(/[[:cntrl:]]/, "", out)
    gsub(/[[:space:]]+/, " ", out)
    sub(/^[[:space:]]+/, "", out)
    sub(/[[:space:]]+$/, "", out)
    # replace fancy bullets/dashes just in case
    gsub(/•|·|–|—/, "-", out)

    if (length(out) > maxch) out = substr(out,1,maxch-1) "…"
    print out
  }
' "$FILE"
