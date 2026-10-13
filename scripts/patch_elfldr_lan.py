#!/usr/bin/env python3
"""Patch the pinned elfldr's embedded socket server to listen on the LAN.

This is deliberately tied to the exact v0.26-bb1e117 release asset. A changed
upstream ELF must be reviewed and this script updated rather than patched by
an unbounded byte search.
"""

import hashlib
import sys
from pathlib import Path


EXPECTED_SIZE = 394_480
EXPECTED_SHA256 = "fa3f0c2b778318000982ada05c01bde70ac875c85e4be6fcc9b5ba836f6d1c3c"
CONTEXT_OFFSET = 0x33E40
ORIGINAL = bytes.fromhex("c78574ffffff7f00000166c78572ffffff233d")
LAN = bytes.fromhex("c78574ffffff0000000066c78572ffffff233d")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: patch_elfldr_lan.py INPUT.elf OUTPUT.elf")
    source, destination = map(Path, sys.argv[1:])
    data = source.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if len(data) != EXPECTED_SIZE or digest != EXPECTED_SHA256:
        raise SystemExit(f"unexpected pinned elfldr: size={len(data)} sha256={digest}")
    if data.count(ORIGINAL) != 1 or data.find(ORIGINAL) != CONTEXT_OFFSET:
        raise SystemExit("the reviewed loopback bind instruction is missing or ambiguous")
    patched = data[:CONTEXT_OFFSET] + LAN + data[CONTEXT_OFFSET + len(ORIGINAL):]
    differences = [i for i, (a, b) in enumerate(zip(data, patched)) if a != b]
    if differences != [0x33E46, 0x33E49] or len(patched) != len(data):
        raise SystemExit(f"unexpected patch difference: {differences}")
    destination.write_bytes(patched)
    print(f"LAN elfldr: {len(patched)} bytes; sha256 {hashlib.sha256(patched).hexdigest()}")
    print("changed offsets: 0x33e46 0x33e49 (127.0.0.1 -> 0.0.0.0)")


if __name__ == "__main__":
    main()
