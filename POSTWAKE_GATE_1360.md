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
The image had not been launched at this deployment gate.

### First automatic Payload Manager attempt

PPSA01651's pre-Rest arm file recorded ID `6ace41b51d84a059`, text base
`ffffffff8bc80000` and pmap root `000000000fad4000`. An independent
post-wake V3 status matched all three, showed AP-complete, zero hook and
restored gate/IST. Before the user launched Payload Manager manually, port
8084 refused connections and the stage log had no post-wake entry for this
attempt. The manual launch later answered `/version` with body `0.5.2` and is
not counted as automatic success. FTP readback of the mounted title confirmed
the new config, JS and ELF hashes. The specific post-wake stopping point is
unproved.

The V2 candidate addresses two plausible post-wake hazards: SIGPIPE on the
closed pre-Rest log socket and file mounts not yet ready when the AP receipt
is written. It does not change the AP payload or hook sequence. V2 native ELF:
209,576 bytes, SHA-256
`fceb24e5f83f3d14358fe4741e5e65611ac68781ab4edb80ff8e839f33010afb`.
The offline ZIP passed CRC, parser/transport tests and embedded hashes;
SHA-256 `634e5aa28edc3613a51cd68129d98c9ff240d8547e246ead44114c5d55934795`.
V2 has not been installed or tested on the console.

GitHub Actions run `38415881929` passed for commit `e454eda`. The downloaded
UFS2 image was 336,789,504 bytes; the workflow manifest and independent local
SHA-256 matched `7187c22657153ccfcd1ed47afee1303e4e6afa5743355262d3b5d2a95991d9ac`.
Both PPSA01651 and PPSA01652 were staged and promoted via ftpsrv, with full
hash readbacks matching before and after promotion. The previous images were
retained as `download0.dat.pre-postwake-v2-20261013`. The local deployment
report SHA-256 is `810f28a322ab9cdfe6f055d73db4365ae06fb2f37478a70cd647cf7363339efd`.
PPSA01651's old image hash differed from the expected V1 image, while
PPSA01652's matched V1; that difference is unexplained. Installed bytes do
not establish that V2 executes or launches Payload Manager automatically.

### V2 live result: automatic manager ready, independent status failed

After a fresh PPSA01651 launch and Rest Mode cycle, the V2 stage log recorded
arm ID `6ace4524b8022059`, AP-complete cleanup, `POSTWAKE_GATE`, and
`POSTWAKE_PM_READY` for the same title and ID. A host request to port 8084
returned HTTP 200 `/version` body `0.5.2` before manual manager launch.
This is evidence of automatic Payload Manager start on that boot.

The separate V3 status read matched the arm ID, base and root and reported
AP complete with zero hook, but returned `ok=0 gate=0 ist=0`. It was saved
locally as `PPSA0165x-postwake-v2-image/postwake-status-v3.txt`, SHA-256
`5233d4aee438f9d20b659bdb127df63314a6dbea19de021ca7bae5563da35d8e`.
The required independent safety gate therefore failed. The coordinator checks
receipt and gate/IST before sending Payload Manager; it does not establish
that these fields remain unchanged after Payload Manager or its own autoload
starts. The cause of the later mismatch remains unproved. No rerun was made.
The user observed that Payload Manager's own configured payloads launched on
this wake and suggested that the shorter Rest Mode interval caused the later
mismatch. The cause remains unverified. A fresh-boot, full-minute repeat is
planned and must use a new arm ID.

### Second V2 live attempt

A fresh PPSA01651 run generated new arm ID `6ace45f68e139059`, base
`ffffffff8ae40000` and root `000000000ec94000`. The V2 stage log again
recorded AP completion, `POSTWAKE_GATE` and `POSTWAKE_PM_READY`; host
`/version` returned `0.5.2` before manual launch. The independent V3 reader
matched the new attempt but again returned `ok=0 gate=0 ist=0` (203 bytes,
SHA-256 `d72f61b202b91fe663b25be34566c14a21a6334a21167dcce2f71d1e4d67b3a6`).
The user confirmed this Rest Mode period was shorter than a minute and the
home screen remained responsive. Both runs were short, so a duration effect
has not been excluded.

The manager's read-only `/log` endpoint showed sends for kstuff-fpkg,
ShadowmountPlus, ProsperoMgr, ps5upload, klogsrv and ps5debug-NG after the
manager started. This is a plausible source of subsequent gate/IST changes,
not a demonstrated cause. The automatic launch capability passed twice; the
post-chain invariant did not. The saved logs remain in the local
`PPSA0165x-postwake-v2-rerun` directory. No third attempt was started.
Read-only FTP saved the active manager autoload and config files. They select
six ELFs and a five-second autoload delay. The manager's `/autoload_status`
reported `total=6 done=6 current=DONE`; this is its own send counter, not
independent execution completion. The files and hashes are under the private
`PPSA0165x-postwake-v2-rerun` directory. A final fresh-boot, full-minute
Rest Mode check is pending.

### Full-minute control result

A third fresh PPSA01651 attempt stayed at steady amber for at least one
minute. Its new arm ID `6ace477b04d7a059`, base `ffffffffd7f10000` and
root `000000001bd64000` matched the independent status. The V2 stage log
again recorded AP completion, `POSTWAKE_GATE` and `POSTWAKE_PM_READY`;
port 8084 answered `/version` with `0.5.2`. The independent V3 read still
returned `ok=0 gate=0 ist=0` (203 bytes, SHA-256
`9aa697a87bd6b71b2e4c1f4af49bcca2530cdc12446825b3e259b61666b0124c`).
The home screen was responsive. Thus a full-minute interval did not resolve
the post-chain discrepancy. Automatic manager readiness is demonstrated on
three distinct attempts; the later gate/IST invariant remains failed.
The next measurement needs to bracket manager autoload, without assuming
which downstream payload changes the fields.

### Stability hold after the third attempt

At about 15:05 UTC, the user reported the PS5 frozen after the full-minute
wake and six-payload manager autoload. No kernel-text reader or diagnostic
watcher had been sent on that boot. The last console actions were the
bounded V3 status ELF and a read-only manager log request. The cause of the
freeze is unproved. No additional console request is authorized by this
record until the user reports recovery and a fresh boot.

An offline host watcher candidate is being prepared to compare the pinned
V3 receipt during the manager countdown with the same receipt after
manager-side autoload completion. It has not run live; the current image
still contains the same tested V2 payload and manager configuration.

## Manual post-wake mode after the stability failure

After the third full-minute run, the user reported the PS5 frozen. They chose
to remove all automatic post-wake payload launches and use Relapse to launch
later ELFs manually. The new package changes only `src/postwake.txt` from
`elf=pldmgr.elf` to `manual` (7 bytes, SHA-256
`cd60ed2fa8c947cb05cb57b23884dea9390e4b6aec0add666e69bf842fc68da0`).
The resumed Byepervisor ELF, AP hook sequence and Y2JB Relapse path remain
unchanged. The native config parser returns its no-launch result for
`manual\n`; its existing host test covers that exact input. The package
still contains Payload Manager as an inert optional file. The main Y2JB JS
returns before the upstream autoloader path, so no later ELF is scheduled
from JavaScript. Parser (48 cases), transport (five cases) and syntax checks
passed offline. A new UFS2 image and console install remain pending; both
currently installed titles still contain the automatic-manager V2 image.
The local WSL build (`bash build.sh --dev --download-deps`) passed and produced
`y2jb_update.zip`, SHA-256
`2126fcdec30ffe6b4135d718f91c000e417d39e7db6cdb4d9198ddc2e1077556`.
ZIP CRC passed; its `postwake.txt` is exactly `manual\n`; the Byepervisor ELF
and inert Payload Manager ELF retain their pinned hashes, and the archive
contains no private kernel dump, synthetic ELF or IDA database. Windows
Clang could not compile the native parser test because it reported no Visual
Studio installation; the same test compiled and ran successfully with WSL
`cc -std=c11 -Wall -Wextra -Werror`. This is an offline/package result only.
