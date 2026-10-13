# Relapse-only Y2JB test image for PPSA01652

This branch preserves the fork's 13.60 Relapse and kexp/elfldr handoff, then
stops before the updater, icon step, and native unified autoloader. It does
not launch Payload Manager, kstuff, Shadowmount, etaHEN, or the HV ELF. A
successful notification means only that the existing Relapse status reported
handoff and pipe disarm, and that Y2JB reached this branch. It does not prove
port 9021 is listening or that a later payload will work.

The only source behavior change is in `src/main.js` after `start_relapse()`
and `is_jailbroken()`. If Relapse reports a crossed or still armed pipe, or no
handoff/status, this image shows an error and stops without claiming the ELF
loader is ready. It does not force-close YouTube.

Target installation: `/user/download/PPSA01652/download0.dat`. The existing
`/user/download/PPSA01651/download0.dat` remains separate. This image is for
one controlled 13.60 comparison with the already built upstream HV ELF; it
does not automate Rest Mode or any payload after wake.

Build provenance and exact SHA-256 values are recorded alongside the
generated image in the investigation workspace. Do not replace the PPSA01651
image with this diagnostic package.
