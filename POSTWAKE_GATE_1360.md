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
The artifact-only workflow run `38409696985` passed and built a clean UFS2
image of 336,789,504 bytes, SHA-256
`b2914ebcb41fbc0d507d63b9db5383d7da131446f7163b67de030e4ebaa66f8d`.
After YouTube was closed, the same image was installed in both regional titles;
the staging and final readback hashes matched for each, and prior files were
retained as `download0.dat.pre-v3wait-20261013`. The revised image has not
yet run. The screenshot identifies
PPSA01652; a later FTP listing showed only a PPSA01651 failure log, so that
saved file cannot be attributed to the photographed launch. YouTube survival,
post-wake JS continuation, and native autoload remain unproved.

## Optional native post-wake candidate

The revised PPSA01651 launch subsequently produced a pre-Rest arm file whose
ID, kernel text base and pmap root exactly matched the independent post-wake
V3 status. That status reported AP-complete, zero hook state and restored
gate/IST. The home screen remained responsive. The YouTube process produced
no post-wake JS continuation; the native Byepervisor process is therefore the
candidate coordinator.

The package now contains `postwake.txt` and the 13.60 native coordinator.
If the config is absent or says `manual`, no extra ELF is sent. The current
test image explicitly says `elf=pldmgr.elf`; only that one ELF is sent after
receipt validation. It must answer HTTP `/version` on port 8084 with body
`0.5.2` to count as ready. Another safe filename can be configured, but its
socket send is not proof that it started. The config parser passed 13 native
host cases. The Y2JB parsers passed 48 cases, its transport passed five cases,
and the ZIP passed CRC and embedded hashes.

Current offline ZIP SHA-256:
`24ad2fe211985c7cdd169baf24c88c36a34b148ade9cdabb7d35615c12c25550`.
Native coordinator ELF: 209,408 bytes, SHA-256
`4736c131f13d6879eabdcde4ea2911678a4d1919e9a2e8e72c7a638d4ba484cd`.
Payload Manager v0.5.2 ELF: 2,410,776 bytes, SHA-256
`62b3ba2a4937c2afc502f9a4e7242cca538610ebb4ae2800c7c6f72e7f268e7c`.
The revised package had not been installed at this offline gate.
Payload Manager retains control of its own autoload settings after it starts.
GitHub Actions run `38413832508` passed and produced a 336,789,504-byte UFS2
image from commit `02dcc79`, SHA-256
`f5191fa528ac86eeaaeeb9f55574d826e0554b4ba9c0a490e788598f1b55e0d8`.
The workflow manifest and independent local hash match. The image was then
installed while both YouTube titles were closed. ftpsrv on port 2121 staged,
fully read back, promoted and fully read back each title image. Both PPSA01651
and PPSA01652 matched the new image hash above. Prior copies remain as
`download0.dat.pre-postwake-20261013`. The 1,197-byte local deployment report
has SHA-256 `30af26db8a2fc2386e0ce0dcb220da5920fdb4bb5e1bd87ad6ae4e930e64b82c`.
No new-image live launch has occurred yet.
