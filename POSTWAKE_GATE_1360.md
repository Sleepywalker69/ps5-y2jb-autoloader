# Post-wake status gate draft

`src/postwake_status.js` is an offline-tested parser and draft reader for the
separate `attempt_status_v3_1360.elf` candidate in the Byepervisor-Reborn fork.
It is not loaded by `main.js`; the current entry point still exits after the
Relapse/elfldr handoff and sends no later payloads.

The current arm parser accepts one `BPR_ARM_V2` line containing the attempt ID,
kernel text base, and kernel pmap root. The V3 status parser requires the same
three values after wake, firmware 13.60, AP-complete marker, zero hook state,
matching arm/completion ID, and restored gate/IST. `kern.boottime` is reported
for diagnosis but is not an equality gate: it shifted in the first live V2
Rest Mode cycle. Run `node tests/postwake_status.test.js` for 23 V2 and 25 V3
parser cases. The transport helper and V3 exchange have not been exercised
from YouTube. The current branch does not build, upload, or enable an autoload
chain.

Before wiring the reader into `main.js`, verify the new receipt on a controlled
console attempt and observe whether the YouTube process and elfldr survive the
Rest Mode cycle. A failed or missing receipt must leave later payloads
disabled. The current package on the console is not changed by this branch.

## V2 live finding and V3 candidate

The first live attempt produced a matching arm/completion ID, AP-complete,
zero hook, and restored gate/IST, but `kern.boottime` shifted across Rest Mode.
The strict V2 parser therefore rejected it and no later payload ran. V3
compares the arm ID plus kernel text base and pmap root from before Rest Mode
against an independent post-wake status. `kern.boottime` remains in the output
for diagnostics. The Node suite now passes 23 V2 and 25 V3 parser cases,
including stale, missing, mismatched, and failed states. This V3 path has not
been run from YouTube or integrated with `main.js`.
