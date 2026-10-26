# UV Studio+

UV Studio+ is [UV Studio](https://armel.github.io/uvstudio/) by Armel F4HWN, plus
CHIRP-style memory channels and radio settings for Quansheng UV-K1 and UV-K5 V3
radios on F4HWN firmware. It is an independent fork maintained by KO4CGQ for the
W8LBZ club, and it follows every UV Studio release.

[Open UV Studio+](https://w8lbz.github.io/uvstudio/)

F4HWN doesn't support this fork: please report UV Studio+ problems here, not
upstream. Original UV Studio: <https://armel.github.io/uvstudio/>

## What UV Studio+ adds

Everything UV Studio does (listed below) works the same here. On top of that:

- **Memories**: read, edit and write all 1024 memory channels and the VFOs, CHIRP style.
  CHIRP CSV import (at the CSV's locations, append, prepend, or replace all, with optional
  duplicate skipping, from a file or a URL) and export, raw backups, multi-row editing
  (move, insert, delete and shift, copy and paste, set a field on every selected row),
  scan list names.
- **Radio settings**: the radio's menu settings, including FM broadcast presets and ScMix,
  plus what CHIRP sets that the menu doesn't show: the channel VFO A and VFO B start on,
  Main VFO, and DTMF tone timings. Everything CHIRP sets on these radios is covered.
- **Android support**: Chrome on Android works through a built-in WebUSB driver for the
  cable's CH340 chip, with a layout that fits a phone screen. iOS and iPadOS aren't
  supported: as of iOS 27, Safari (and every iOS browser, which all use WebKit) has
  neither Web Serial nor WebUSB. If WebKit adds Web Serial, iOS support will be looked at.
- **Works offline, installs as an app**: after one visit with a connection it opens and
  talks to the radio without one, help included, for field use. Online it always loads the
  latest version, and after an offline start it offers to reload once a newer one is online.
  Chrome can install it with its own window and icon (Install app, or Add to home screen).
- **Help for beginners**: column headers and setting labels open plain-language help
  (English and French), plus a guide for every tool panel.
- **Safer writes**: only changed bytes are written and verified; a one-time
  licensed-operator acknowledgement before the first write; a warning before leaving with
  unwritten edits.
- **Conveniences**: reuses the serial port you already granted, shows the radio's firmware
  version, names calibration backups by radio, and has a Copy log button.

See [CHANGELOG.md](CHANGELOG.md) for what changed in each release.

## From UV Studio

UV Studio is a unified browser-based workspace for compatible Quansheng UV-K1 and UV-K5
radios. It combines the live display and remote control features of K5Viewer with the
firmware and maintenance tools of UVTools2 in one interface. Communication with the radio
is performed directly through the Web Serial API. No installation, server, dependency, or
build step is required.

- Real-time 128 × 64 radio display
- Virtual UV-K1 and UV-K5 keypads with short- and long-press support
- RF activity log with live entries, session markers, and analytics
- Firmware flashing from a local binary file or a URL
- Back up and restore radio calibration data
- Upload and download custom 128 × 64 boot logos
- Export the latest RF Log activities as CSV
- Apps and external flash management (Labs firmware), factory reset
- Light and dark themes
- Global serial connection and operation status
- Interface translations for ten languages

## Requirements

- A compatible Quansheng UV-K1 or UV-K5 radio
- A data-capable USB serial cable
- A desktop browser with Web Serial support, such as Chrome, Brave, Edge, Opera, or Firefox 151+
- Or Chrome on Android (tested on a Pixel 9; on GrapheneOS set USB-C port to "Charging-only when locked")
- iPhone and iPad are not supported (no Web Serial in WebKit)

## Safety

Flashing an incompatible or corrupted firmware image may leave the radio
unusable. Verify that the firmware matches the radio model and bootloader,
back up the calibration data first, and keep the cable connected until every
write operation is complete.

## Usage

### Live Viewer and RF Log

1. Connect the radio to the computer with the USB serial cable.
2. Open UV Studio and select Live Viewer.
3. Select Connect and choose the radio serial port.
4. Use the on-screen keypad or keyboard to control the radio.
5. Open RF Log to inspect live activity or analytics when supported by the firmware.
6. Select Disconnect before unplugging the cable.

### Firmware and maintenance tools

Use the navigation sidebar to flash firmware, manage calibration data,
manage the boot logo or external flash, restore a UV-K1 or UV-K5 V3 to its
reconstructed factory state while preserving calibration, or export the RF Log.
Follow the instructions
shown for the selected operation. Keep the radio in normal mode for maintenance
operations and use DFU mode only when flashing firmware.

### Memories

Open Memories, select Read from radio, edit the table, then select Write
changes to radio. Only the changed bytes are written; they are read back to
verify them, then the radio reboots. Import CSV merges a CHIRP CSV export into
the channels at their Location (1–1024). Save backup and Open backup use a raw
34 KiB image of the channel, name, and attribute areas. A radio locked with a
custom AES key cannot be read or written over USB and is reported as such.

The TX lock column keeps a channel within the F Lock band plan (the firmware
default). Clearing it lets that channel transmit outside the band plan. Busy
lock, reverse, compander, and PTT ID are also editable per channel. Scan list
names (3 characters, as shown on the radio) are edited above the table.

Tick rows (shift-click selects a range) to move them up or down, insert an
empty channel above, delete and shift the rest up, copy and paste, or set one
field on every selected channel. Moving channels does not update priority or
call channel numbers in Radio settings.

### Radio settings

Open Radio settings, select Read from radio, change settings, then select Write
changes to radio. Settings use the radio's own menu names and values. ScMix picks which
scan lists the MIX scan list setting combines. Battery calibration and the volume gain
stored in the calibration area are not shown. VFO A and VFO B set the channel each side
starts on (the radio updates them itself as you change channels); the DTMF group adds tone
timings the radio's menu doesn't show. Opening a
settings backup never restores its AES key or firmware version bytes.

## Run locally

UV Studio is a static HTML, CSS, and JavaScript application. Open index.html
directly in a compatible browser. A local web server is not required. The offline copy
(sw.js) needs http(s), so it is off when opened as a file.

## Project structure

- index.html — unified application markup
- css/core.css — shared design tokens, controls, and overlays
- css/studio.css — UV Studio shell and integration styles
- css/viewer.css — scoped live viewer, keypad, RF Log, and analytics styles
- css/tools.css — scoped firmware and maintenance tool styles
- js/studio-version.js — single public UV Studio version
- js/studio-preferences.js — resilient local and in-memory preference storage
- js/studio.js — navigation and application coordination
- js/studio-serial.js — exclusive serial-port ownership, operation locking, and connection state
- js/k5viewer.js — serial display protocol, keypad, RF Log, and analytics
- js/flash.js — firmware, calibration, and boot logo operations
- js/rf-log.js — RF Log packet parsing and CSV generation
- js/memories.js — memory channel codec, CHIRP CSV, and the Memories panel
- js/settings.js — radio settings field table and the Radio settings panel
- js/webusb-serial.js — Web Serial over WebUSB for the CH340 (Android)
- sw.js, js/offline.js, manifest.webmanifest — offline copy, update offer, and app install
- js/studio-i18n.js — shared translation engine and language preference
- locales/ — unified dictionaries for Studio, K5Viewer, and UVTools2
- tests/ — Node.js protocol, controller, locale, and static integration tests

Run the local test suite with `node --test tests/*.test.js`.

### Browser smoke test

`tools/smoke.js` drives the Memories and Radio settings panels in headless
Chrome against a fake radio that speaks the real serial protocol (handshake,
EEPROM read/write, reboot, and a locked-radio case). No radio or npm packages
are needed, only Node.js and a Chrome or Chromium binary:

```
CHROME=/path/to/chrome node tools/smoke.js index.html /tmp/uvstudio-smoke
```

It prints what was read, edited, and written to the fake radio, and saves
`memories.png` and `settings.png` in the output folder. Without `CHROME` it
looks for Playwright's headless shell in `~/.cache/ms-playwright`. It uses the
DevTools port 9333 and is not part of `node --test`.

## Origin and attribution

UV Studio incorporates K5Viewer and UVTools2. Their original attribution notices
are retained in [NOTICE](NOTICE).

UV Studio+ changes are listed in [CHANGELOG.md](CHANGELOG.md). The main fork-only files
are js/memories.js, js/settings.js, js/webusb-serial.js, js/license-ack.js,
js/doc-viewer.js, sw.js, js/offline.js, manifest.webmanifest and docs/help/; other
changes are spread through index.html, js/flash.js, js/studio.js, the CSS, locales/
and tests/.

## License

Copyright 2026 Armel FAUVEAU.
UV Studio+ modifications Copyright 2026 KO4CGQ.

UV Studio and UV Studio+ are licensed under the [Apache License 2.0](LICENSE). See
[NOTICE](NOTICE) for attribution information.
