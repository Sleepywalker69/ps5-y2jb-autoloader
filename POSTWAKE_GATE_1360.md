# Post-wake status gate draft

`src/postwake_status.js` is an offline-tested reader for the separate
`stage_status_1360.elf` diagnostic in the Byepervisor-Reborn fork. It is not
loaded by `main.js`; the PPSA01652 entry point still exits after the verified
Relapse/elfldr handoff and sends no later payloads.

The parser accepts exactly one `BPR_STATUS_V1` success line with firmware
13.60, matching `kern.boottime`, the AP-complete marker, zero hook state, and
matching saved/live gate and IST. Run `node tests/postwake_status.test.js` for
the 15 focused parser cases. The transport helper is drafted but has not been
exercised from the YouTube process. An ELF send and a parsed line also do not
prove that a *new* S3 attempt produced the marker: it can persist for the same
boot. The current branch does not build, upload, or enable an autoload chain.

Before wiring the reader into `main.js`, establish a receipt specific to one
arm/resume attempt and observe whether the YouTube process and elfldr survive
that Rest Mode cycle. A failed or missing receipt must leave later payloads
disabled. The current package on the console is not changed by this branch.
