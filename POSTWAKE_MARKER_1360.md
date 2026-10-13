# 13.60 configured ELF execution check

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

The marker does not start Payload Manager or other ELFs. It does not change
kernel or A53 state. This branch is a controlled test image; live execution
has not yet been verified. The installed manual-mode image is unchanged until
this branch's UFS2 image is explicitly deployed.

## Controlled run

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

After the test, restore the manual-mode image if no optional post-wake ELF is
desired.
