# 13.60 configured ELF execution check

**Live test status (13 October 2026): failed; do not treat this image as a
working post-wake payload chain.** A PS5 on FW 13.60 powered off after the
first Rest Mode/wake cycle with this image installed. The user described a
kernel panic after wake. No post-wake arm ID, marker file, stage log, or
independent receipt was retrieved from that cycle, so the failing component
is not identified. Do not automatically advance from this test to the
Payload Manager variant.

This branch packages `postwake.txt` as
`elf=postwake_receipt_marker_1360.elf`. The native coordinator sends that
one ELF only after its current-attempt AP-complete, hook-zero and restored
gate/IST checks, including the PPSA01651/PPSA01652 arm-file match.

The marker ELF independently reads the same live receipt and matches exactly
one title arm file. It writes `/data/bpr-postwake-probe-<arm-id>.log` with the
firmware, boot time, title, arm/completion IDs, base, pmap root, AP stage and
gate/IST result. It exits without a marker if a check fails. A matching new
file plus a separate post-wake receipt read will prove configured ELF
execution on that attempt; a socket send alone will not.

The marker accepts the exact three-line title/arm/base/root prefix even if
the resumed YouTube script has appended its post-wake status. The earlier
EOF requirement could reject a valid current attempt during that race.
Missing, stale, mismatched, or oversized arm records still fail. The
recompiled marker ELF is 110,936 bytes, SHA-256
`ca956d99487f28f542aee168e2ae22589e91b037db248857d23783f18f1a6df1`.

The marker does not start Payload Manager or other ELFs. It does not change
kernel or A53 state. This branch is a controlled test image; live execution
has not been verified.

## First live attempt and evidence limit

- The CI-built `download0.dat` was 336,789,504 bytes, SHA-256
  `bc50e6b179d03b30fa97cbd45a8d9744a96f0002d78ddeb2d1a40a0603b2ca66`.
  Both YouTube title copies were staged, read back, promoted, and read back
  again at that hash. Previous images were retained as backups.
- A fresh-boot read-only gate before replacement confirmed a different boot
  from the prior stalled session, FTP command response, and a 4,096-byte
  first read from each current and backup title image. One current title
  had a different, readable prior image; its content identity was not
  established. This gate is evidence about file I/O, not S3 success.
- The user rebooted and ran one of the identical YouTube icons. The host
  made no console request during the Rest Mode/wake cycle. After waking,
  the user reported a kernel panic and then a powered-off console. The
  exact title, arm ID, AP result, marker execution, and fault location
  remain unknown. A recovery capture on the next boot found the last saved
  Byepervisor session through hook arming but no later event for that
  session. File logging pauses during the hook, so this gap does not
  identify the failing stage. No arm or marker file survived the reboot.
- Relative to the manual branch, this branch selects the diagnostic ELF in
  `postwake.txt` and packages that ELF. The timing makes the added path a
  candidate cause; it does not prove which instruction or component failed.
  No marker success claim or later-payload launch claim follows from this run.

Recovery logs were preserved privately. Both titles were then restored to
the known manual-mode image, 336,789,504 bytes, SHA-256
`ff1ec8eea341fc282416ba07047e51a6d0e074019c8ef10bf6b4ccea777725c0`,
and fully read back. The prior marker images remain in backup files. The
restored image has not run on this boot. The user is unavailable to observe
a live test now, so no new YouTube launch, ELF send or Rest Mode cycle
followed.

The next comparison should run one manual-mode wake on a fresh boot with
an operator watching. Require one current title arm, independent V3
AP-complete receipt with zero hook and restored gate/IST, and a matching
`POSTWAKE_MANUAL` event. Only after that passes should the same pinned marker
ELF be sent separately through elfldr once, requiring its exact per-attempt
file and a second matching receipt. The private control parser has five
passing offline failure-path tests; it has not run on PS5. Do not redeploy
the configured marker image or advance to Payload Manager based on this
offline control.

## Historical planned acceptance gate (not passed)

1. Reboot the PS5 and make sure Payload Manager and other autoload chains are
   absent. Start PPSA01651 YouTube once.
2. Let it enter Rest Mode, wait for steady amber, leave it for about one
   minute, then wake it once.
3. Read the new Y2JB arm file and the corresponding
   `/data/bpr-postwake-probe-<arm-id>.log` through FTP. Require the same arm
   ID, title, kernel base and pmap root in both.
4. Run the independent read-only V3 receipt status ELF. Require AP complete,
   zero hook state, matching completion ID, and restored gate and IST. Its
   boot time must match the marker's boot time. Stop on any missing or
   mismatched field.

This gate was not reached in the first live attempt. The procedure above is
retained as the intended acceptance criteria, not as an instruction to rerun
the failed image without fault isolation.
