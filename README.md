<p align="center">
 <img src="./src/icon0.png" width="128" />
</p>
<h1 align="center">PS5 Y2JB Autoloader</h1>
<h3 align="center">Fork of <a href="https://github.com/Gezine/Y2JB">Y2JB</a></h3>

## Experimental 13.60 manual-mode image

This build runs Relapse and the Byepervisor Rest Mode stage on PS5 firmware
**13.60**. The packaged `postwake.txt` is `manual`, so it launches **no**
additional ELF after wake. A matching AP-complete receipt, zero hook state, and
restored gate/IST were observed on one console. That result does not establish
working kstuff, fPKG support, or compatibility with other consoles or firmware.

When published, get `download0.dat` from the
[release ZIP](https://github.com/Sleepywalker69/ps5-y2jb-autoloader/releases).
Until then, use the
[manual-mode Actions artifact](https://github.com/Sleepywalker69/ps5-y2jb-autoloader/actions/runs/38419602775/artifacts/11825497668)
(`y2jb-1360-postwake-config-test`). Check the extracted file's hash before
installation:

```text
SHA-256  ff1ec8eea341fc282416ba07047e51a6d0e074019c8ef10bf6b4ccea777725c0
Size     336789504 bytes
```

### Install and run

1. On firmware 13.60, install the matching regional YouTube app version
   `v01.009.253`. The manual-mode image was installed and checked on
   `PPSA01651` and `PPSA01652`.
2. Close YouTube. Back up its existing `download0.dat`, then copy the verified
   replacement to `/user/download/<TITLE_ID>/download0.dat`, where `<TITLE_ID>`
   is the installed YouTube title (`PPSA01651` or `PPSA01652`).
3. Keep Wi-Fi or Ethernet connected to a local network; Internet access is not
   required for Relapse. Launch that YouTube app.
4. After the Byepervisor arm notice, the build requests Rest Mode. **Wait until
   the power light settles to steady amber, leave it there for about one
   minute, then wake the console.** Do not count a notification or a socket
   send alone as proof of AP completion.
5. Once the home screen is responsive, send any additional ELF yourself through
   **elfldr** (LAN port `9021`) **or launch it from the Relapse page**. This image
   does not automatically launch Payload Manager, `autoload.txt` entries, or
   other post-wake payloads.

The [13.60 gate record](POSTWAKE_GATE_1360.md) distinguishes the observed
manual-mode wake and independent receipt from unverified downstream behavior.
For the original multi-firmware autoloader and its automatic payload modes,
see [itsPLK/ps5-y2jb-autoloader](https://github.com/itsPLK/ps5-y2jb-autoloader).

## Credits

* **[Gezine](https://github.com/Gezine)** - creator of the original [Y2JB](https://github.com/Gezine/Y2JB)
* **[shahrilnet](https://github.com/shahrilnet), [null_ptr](https://github.com/n0llptr)** - Referenced many codes from [Remote Lua Loader](https://github.com/shahrilnet/remote_lua_loader)
* **[BenNoxXD](https://github.com/BenNoxXD)** - [ClosePlayer](https://github.com/BenNoxXD/PS5-BDJ-HEN-loader) reference
* **[ntfargo](https://github.com/ntfargo)** - Thanks for providing V8 CVEs and CTF writeups
* **abc and psfree team** - Lapse implementation
* **[matem6](https://github.com/matem6)** - [P2JB](https://github.com/matem6/P2JB-Y2JB-Porting) implementation
* **[edisnord](https://github.com/edisnord)** - [Relapse](https://github.com/edisnord/relapse-y2jb) implementation
* **[flat_z](https://github.com/flatz) and [LM](https://github.com/LightningMods)** - Helping implement GPU rw using direct ioctl
* **[john-tornblom](https://github.com/john-tornblom) and [EchoStretch](https://github.com/EchoStretch)** - Providing elfldr.elf payload
* **[hammer-83](https://github.com/hammer-83)** - Various BD-J PS5 exploit references
* **[zecoxao](https://github.com/zecoxao), [idlesauce](https://github.com/idlesauce), and [TheFlow](https://github.com/theofficialflow)** - Helping troubleshoot dlsym
* **[Dr.Yenyen](https://github.com/DrYenyen) and PS5 R&D community** - Testing Y2JB
* **Rush** - Creating Y2JB backup file
* **[Feyzee61](https://github.com/Feyzee61)** - [download0.dat generator workflow](https://github.com/Feyzee61/ps5-y2jb-autoloader/blob/main/.github/workflows/build.yml)
* **[ufm42](https://github.com/ufm42)** - [kexp](https://github.com/ufm42/kexp) used for PS5 post JB all-in-one shellcode

## License

This project is licensed under the **GPL-3.0 License**.

The original **Y2JB** base code remains under its original **MIT License** (see [LICENSE-MIT](LICENSE-MIT)).  
All unique modifications and additions in this fork are licensed under **GPL-3.0**.

## Disclaimer

This tool is provided as-is for research and development purposes only. Use at your own risk. The developers are not responsible for any damage, data loss, or consequences resulting from the use of this software.

## Donate
- [donate to PLK](DONATE.md) (creator of this autoloader)
- [donate to Gezine](https://github.com/sponsors/Gezine) (creator of the original [Y2JB](https://github.com/Gezine/Y2JB))
