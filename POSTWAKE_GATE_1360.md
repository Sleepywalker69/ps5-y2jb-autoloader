# Post-wake status gate draft

`src/postwake_status.js` contains the V3 arm and status transport for the
isolated Y2JB receipt test. `main.js` now loads it after the Relapse/elfldr
handoff. It sends the tested V3 hook ELF, saves the returned arm line to
`/user/temp/common_temp/bpr-y2jb-<TITLE_ID>.log`, waits through Rest Mode,
then asks elfldr for an independent V3 status. It does not start the native
autoloader or any configured later payload in this test build.

The current arm parser accepts one `BPR_ARM_V2` line containing the attempt ID,
kernel text base, and kernel pmap root. The V3 status parser requires the same
three values after wake, firmware 13.60, AP-complete marker, zero hook state,
matching arm/completion ID, and restored gate/IST. `kern.boottime` is reported
for diagnosis but is not an equality gate: it shifted in the first live V2
Rest Mode cycle. Run `node tests/postwake_status.test.js` for 23 V2 and 25 V3
parser cases. Four mock-socket transport cases cover split arm output, missing
arm, failed connection, and invalid zero ID. The V3 exchange has not been
exercised from YouTube. No later payload chain is enabled.

The standalone receipt passed on one boot. The next gate is to observe whether
the YouTube process and elfldr survive the Rest Mode cycle when YouTube sends
the hook itself. A failed or missing receipt leaves later payloads disabled.
Both regional packages were subsequently replaced with the verified UFS2
image; their previous `download0.dat` files remain as local console backups.

## V2 live finding and V3 candidate

The first live attempt produced a matching arm/completion ID, AP-complete,
zero hook, and restored gate/IST, but `kern.boottime` shifted across Rest Mode.
The strict V2 parser therefore rejected it and no later payload ran. V3
compares the arm ID plus kernel text base and pmap root from before Rest Mode
against an independent post-wake status. `kern.boottime` remains in the output
for diagnostics. The Node suite now passes 23 V2 and 25 V3 parser cases,
including stale, missing, mismatched, and failed states. The V3 path is now
integrated in `main.js` for a **receipt-only** survival test, but has not been
run from YouTube.

## Controlled V3 receipt result

One standalone Relapse/elfldr attempt on firmware 13.60 produced
`BPR_ARM_V2 id=6ace3357104ff054 base=ffffffff998a0000
root=000000001d6f4000` before Rest Mode. The independent post-wake
`BPR_STATUS_V3` returned the same values, AP complete, zero hook, matching
completion ID, and restored gate/IST. The home screen remained responsive.
The helper `node tests/check_live_receipt.js ATTEMPT.log ATTEMPT.json STATUS.log`
accepted those saved local records. `kern.boottime` changed across S3 and is
informational. The raw logs remain outside Git. This establishes one passing
receipt but does not prove YouTube or the JS transport survives Rest Mode.

## Receipt-only Y2JB package, offline gate

The two copied ELF files match the standalone-tested SHA-256 values:
`4e303c1a5d409013637bded728602103ab39f4948d3f5888d7e9a5d98c0ab810`
for the hook and
`3b17d7e24c44b2341e3a65b133f74f052d95540ba453becd58378aaa2f35e4a5`
for the status reader. `make all BUILD_TYPE=dev` produced `y2jb_update.zip`;
the archive passed its CRC check, includes both exact ELFs, and contains no
kernel dump, synthetic ELF, or IDA database. The current local ZIP SHA-256 is
`5a14039ce64ca55ed0a5e7cfdd850f2efa228eb4da31dbb53b3d1b6144cf90ca9`.
The artifact-only workflow generated a UFS2 `download0.dat` from this branch.
The current live image and title results are recorded below.

The feature branch's existing `.github/workflows/dev.yml` dispatch path now
builds an artifact-only UFS2 image with no release step. GitHub did not accept
dispatch of a new workflow file that was absent from the fork's default branch
(`HTTP 404: workflow receipt-test.yml not found on the default branch`), so
the existing workflow ID is used for this branch build instead.

## UFS2 image and console install

GitHub Actions run `38407230658` passed its ZIP checks and FreeBSD UFS2 build.
The downloaded `download0.dat` is 336,789,504 bytes; local SHA-256 and the
workflow manifest both report
`9dd53c4cf25c465a8d9b2f522c10055a2c187dbe4f4e51a002f6623f382a024f`.
With the user's authorization, the same image was uploaded to both
`/user/download/PPSA01651/download0.dat` and
`/user/download/PPSA01652/download0.dat` through zftpd port 2120. Each staging
copy and each promoted file passed a full SHA-256 readback. The previous image
in each title is retained as `download0.dat.pre-v3-20261013`. The new image
was launched once from PPSA01652. The visible Relapse trace reached clean
handoff, but the V3 sender's immediate local connection to elfldr failed
before any arm ID, payload send, or Rest Mode request. A host connection to
port 9021 failed just afterward and succeeded later. This suggests loader
readiness timing, without proving the console-local socket's state. The
current sender now waits for up to 50 fresh local connection attempts spaced
200 ms apart, logs the final connect result on failure, and still sends no
configured later payloads. Offline transport tests cover delayed readiness
and timeout. The revised ZIP passed CRC, JS syntax, 48 parser cases, five
transport cases, and both embedded ELF SHA-256 checks; ZIP SHA-256 is
`5318ee9c9836a87f5ec3a707b32d39414a1264e61903a632f99f44b2c399e040`.
This revised UFS2 image is not yet built or run. The screenshot identifies
PPSA01652; a later FTP listing showed only a PPSA01651 failure log, so that
saved file cannot be attributed to the photographed launch. YouTube survival,
post-wake JS continuation, and native autoload remain unproved.
