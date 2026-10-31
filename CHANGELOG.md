# Changelog

What UV Studio+ changed, newest first. Upstream UV Studio changes are only listed
where a merge brought them in; see [UV Studio](https://armel.github.io/uvstudio/) for those.

From 2026.10.0 on, UV Studio+ uses calendar versions (year.month.release), and About
shows which UV Studio release it is based on. Earlier releases were numbered
`<UV Studio version>-w8lbz.<N>`. Builds on the test site show `+test.<commit>`.

## Unreleased

- Help for Message 1 in Radio settings: transmitting apps (Beacon, APRS Digi, KISS TNC, and
  APRS TX without its own callsign) send this line as your call sign, so it should hold only that.

## 2026.10.6 (2026-10-30)

Merged UV Studio upstream:

- Apps: Scan 406 scans the Cospas-Sarsat 406 MHz channels and hands beacon bursts to EPIRB 406.

## 2026.10.5 (2026-10-30)

- Memories: CSV import is now step by step. Choose a file or load a URL, pick where the
  channels go, then press Import into table. Write changes to radio pulses until the
  imported channels (or an opened backup) are written.
- Memories: Sort by channel number, frequency or name (view only; channel numbers
  stay the same on the radio).
- Memories: channels sharing a frequency or a name are outlined, with a tooltip naming
  the other channels. Highlight duplicates turns this off.
- Memories: Scan list names moved below the VFOs, out of the way between import and
  the channel table (they are not part of CSV files).
- Memories and Radio settings: Undo (one change at a time) and Discard changes (back to
  what the radio has; Undo brings them back).
- Memories and Radio settings: sections are framed boxes, each with an "About this
  section" help link under its title.
- Dropdown lists no longer look greyed out in the dark theme.

## 2026.10.4 (2026-10-28)

Based on UV Studio 2.3.0.

Merged UV Studio 2.3.0:

- Apps: a Community tab lists apps shared by their authors (not reviewed by F4HWN), with a
  warning before installing one. Propose an app checks a .app file, captures the radio
  screen as its screenshot, and opens the submission on GitHub.
- Apps: catalog entries can show screenshots.

Other changes:

- Clearer help for the VFO rows and TX lock in Memories: a VFO row is where that band was
  left, not a rule for the band, and TX lock picks whether to follow the F Lock band plan.
- Fuller help for SetRxA FM and SetRxA AM: what each profile does and when to change it.
- Help pages: links between pages now have a Back button.
- Radio settings: the ScMix scan list checkboxes no longer spill out of their row at some
  window widths.

## 2026.10.3 (2026-10-25)

- Works offline: after one visit with a connection, UV Studio+ opens and talks to the radio
  without one, help pages included, for field use. Online it always loads the latest version;
  after starting offline, it offers to reload once a newer version is online. Firmware and app
  catalogs and imports from a URL still need a connection.
- Installable: Chrome can install UV Studio+ as an app with its own window and icon
  (Install app, or Add to home screen on Android).

## 2026.10.2 (2026-10-25)

- Radio settings: Main VFO and the channel VFO A and VFO B start on (a memory channel or a
  band VFO), as in CHIRP.
- Radio settings: four DTMF timings the radio's menu doesn't show: first code, `*` and `#`,
  other codes, and the gap between codes (30 to 1000 ms, as in CHIRP).

## 2026.10.1 (2026-10-25)

Based on UV Studio 2.2.0.

Merged UV Studio 2.2.0:

- Firmware packages that carry an asset pack (fonts, menus) are flashed in three steps:
  firmware image, radio restart, then the assets are written over serial. "Install firmware
  assets" retries the last step if it didn't finish.
- New apps in the catalog: Sonde MRZ (MRZ-N1 / MP3-H1 radiosondes) and Geo Nav.

Fixes:

- Memories on a phone: an expanded card now stays with its channel when channels are moved,
  inserted, deleted or pasted over, and cards fold up after Read, CSV import or opening a backup.
- Memories on a phone: a Select all shown checkbox above the channel cards.
- Read clicked while the page was still connecting could do nothing; it now waits for the connection.
- Copy log says when copying fails instead of failing silently.
- Android: bytes the radio sent while a reader was being replaced are no longer lost.
- Memories: moving, inserting or deleting channels no longer marks untouched empty slots as
  changed (radios keep leftover bytes in deleted slots; they are now carried along as they are).
- On phones and narrow windows, picking a page folds the menu away, so the page starts at the
  top of the screen (the menu button brings it back).
- The browser tab is titled UV Studio+ again instead of reverting to UV Studio.

## 2026.10.0 (2026-10-25)

Based on UV Studio 2.1.0.

- **Android support.** Chrome on Android can now talk to the radio. A built-in WebUSB
  driver for the cable's CH340 chip replaces Android Chrome's own Web Serial, which
  doesn't list the CH340. Tested on a Pixel 9 running GrapheneOS (set USB-C port to
  "Charging-only when locked"). iPhone and iPad aren't supported: WebKit has neither
  Web Serial nor WebUSB.
- Copy log button next to Show Console, for getting the log off a phone.
- Phone layout: Memories channels and VFOs are collapsed cards showing the name and
  frequency (plus offset, tones and any non-FM mode); tap to expand into labelled
  fields. The Live Viewer screen shrinks to fit the phone.
- About shows which UV Studio release UV Studio+ is based on.
- Tidier Memories page: Import, Export and Open backup moved into an "Import and export"
  box; the multi-row editing bar only appears once a channel is ticked, stays in view while
  scrolling, and on phones folds its buttons into an Edit selected menu; the channel list folds away like Scan list names and VFOs.

## 2.1.0-w8lbz.8 (2026-10-24)

- Calibration download button names the real file.

## 2.1.0-w8lbz.5 to 2.1.0-w8lbz.7 (2026-10-24)

- A firmware pill next to the connection status shows the radio's firmware version
  (and `· Labs` on Labs firmware).
- Calibration backups are named `calibration-<id>-<date>.dat`, where the ID comes from
  the calibration data, so one radio always gets the same ID.

## 2.1.0-w8lbz.3 (2026-10-24)

- Fixed the first read after replugging the radio failing on a stale port.
- Change port logs which port was picked.

## 2.1.0-w8lbz.2 (2026-10-24)

- Merged UV Studio 2.1.0: serial auto-reconnect, edition-aware navigation, QRMap app.
  (2.1.0-w8lbz.1 was this merge; it was never published on its own.)
- Renamed the fork **UV Studio+** (by KO4CGQ). About credits UV Studio by F4HWN and asks
  for fork problems to be reported here, not to F4HWN.

## 2.0.0-w8lbz.10 to 2.0.0-w8lbz.21 (2026-10-23): help

Published: .10 to .13, .18, .20 and .21; the others were folded into the next push.

- README, LICENSE and NOTICE open in an in-page viewer.
- Beginner help everywhere: Memories column headers and Radio settings field labels open
  a help page at that field; a guide for every tool panel; overview pages and a Help
  entry on the About page. English and French.
- One-time licensed-operator acknowledgement before the first write to the radio.
- Radio settings groups fold and unfold.
- Calibration restore warning.

## 2.0.0-w8lbz.9 (2026-10-23)

- Merged UV Studio upstream: new apps, app catalog, translations.

## 2.0.0-w8lbz.8 (2026-10-23)

- Reuses the serial port you already granted instead of asking with the picker every time.

## 2.0.0-w8lbz.7 (2026-10-22)

Fixes from the first hardware test:

- Erased channel records no longer show up as channels.
- VFO frequencies snap to the step grid the way the radio does.
- Editing one VFO no longer counts as two changes.
- Clearing the frequency deletes the channel (or resets the VFO).
- Clearer FM band error; scan group layout fix; a warning before leaving with unwritten edits.

## 2.0.0-w8lbz.4 to 2.0.0-w8lbz.6 (2026-10-22)

- CSV import modes: at the CSV's locations, append, prepend or replace all. Option to skip
  duplicates. Import from a URL.
- VFO entries and FM broadcast presets.
- Inputs sized so tones, names and frequencies aren't clipped.

## 2.0.0-w8lbz.2 and 2.0.0-w8lbz.3 (2026-10-22)

- Per-channel busy lock, reverse, compander and PTT ID; scan list names.
- ScMix (which scan lists MIX combines).
- Table editing: select rows, move up and down, insert empty, delete and shift up, copy and
  paste, set a field on every selected channel.

## 2.0.0-w8lbz.1 (2026-10-22): first fork release

- **Memories**: read, edit and write the 1024 memory channels. CHIRP CSV import and export,
  raw backup and restore. Only changed bytes are written, then verified.
- **Radio settings**: the radio's menu settings, read, edited and written the same way.
- Headless browser smoke test against a fake radio.
