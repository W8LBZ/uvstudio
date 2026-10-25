# Changelog

What UV Studio+ changed, newest first. Upstream UV Studio changes are only listed
where a merge brought them in; see [UV Studio](https://armel.github.io/uvstudio/) for those.

From 2026.10.0 on, UV Studio+ uses calendar versions (year.month.release), and About
shows which UV Studio release it is based on. Earlier releases were numbered
`<UV Studio version>-w8lbz.<N>`. Builds on the test site show `+test.<commit>`.

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
