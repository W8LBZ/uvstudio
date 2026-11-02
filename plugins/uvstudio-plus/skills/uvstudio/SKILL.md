---
name: uvstudio
description: Drive UV Studio+ in the browser (Claude in Chrome) for a Quansheng UV-K5 V3 / UV-K1 on F4HWN firmware - navigate the app, help configure memories, scan lists and radio settings without writing to the radio, look up firmware behavior, or hardware-test a new UV Studio+ build.
metadata:
  version: 1.0.0
---

# UV Studio+ (navigate, configure, hardware-test)

UV Studio+ is a static web app that talks to a Quansheng UV-K5 V3 / UV-K1 running F4HWN firmware over Web Serial. It extends UV Studio with **Memories** and **Radio settings** pages. You drive it through Claude in Chrome in a tab the user already has open, with their radio plugged in over USB.

- **Live site:** https://w8lbz.github.io/uvstudio/ (the released build; use it unless told otherwise).
- **Test builds:** https://w8lbz.github.io/uvstudio/test/ (untested work; only when a test plan names it).
- **Upstream UV Studio**, which UV Studio+ is based on: https://armel.github.io/uvstudio/ . It has no Memories or Radio settings pages.

You are a user of the app here, not a developer: **report bugs, never patch the page or its code.**

## Where bugs go

Draft the report (steps, expected vs seen, exact log lines, build version from the sidebar footer, radio firmware version) and give it to the user to file. Never file issues, comment or post yourself.

- **UV Studio+ (https://github.com/w8lbz/uvstudio/issues):** anything on the **Memories** or **Radio settings** pages (CSV import/export, extra columns, checks, Close gaps, backups, VFOs, scan list names), their help pop-ups, the sidebar version and About, the offline/install behavior, and this skill.
- **armel (https://github.com/armel/uv-k1-k5v3-firmware-custom/issues):** the radio's own behavior (firmware), and the pages UV Studio+ shares with UV Studio: Live Viewer, RF Log, Flash Firmware, Firmware Slots, Apps, Calibration, Boot Logo, External Flash, Factory reset.
- **Not sure** (a shared page acting oddly, or something that may be the radio): check whether it also happens on upstream UV Studio. Same there: armel. Only in UV Studio+: UV Studio+. Say which you checked.

## Pick the mode

- **Navigate / explain:** where something lives in the app or on the radio, what a setting does, how a feature works. Read the page and the docs and answer. No changes.
- **Configure:** CSV imports, cleaning up memories, names, scan lists, power, adding listen-only channels, radio settings. Follow "Configure mode".
- **Hardware test:** the user (usually a contributor) pastes a test plan with the URL, expected build version, what changed, and steps. Follow "Hardware test mode".

The hard rules apply to every mode.

**First, check for the user's own notes.** If they keep notes about their radio setup (license class, naming conventions, channel layout), in memory, a project, or a file they point to, read them before proposing changes. Their notes override the defaults here.

## Looking things up

- **F4HWN firmware wiki:** https://github.com/armel/uv-k1-k5v3-firmware-custom/wiki . Covers radio behavior, menus, keys, scanning, calibration, flashing and apps. Page URLs follow `.../wiki/<Title-With-Dashes>`. Most useful: Getting started, Recent changes, Troubleshooting, UV Studio, Programming with CHIRP, Radio operation, Scanning, Menu (incl. hidden settings), Button functions, Advanced features, Spectrum analyzer, Multiboot and Multiconfig, Overlay applications (app catalog, e.g. App-AIS-RX, App-ACARS-RX, App-POCSAG-RX, App-SSTV).
- **What the wiki does not cover:** UV Studio+'s own **Memories** and **Radio settings** pages. For those, use the page's help pop-ups (underlined labels, "How this page works", "About this section", About -> Help). They are documentation only and never talk to the radio. Say when something is unconfirmed.
- **Local frequencies:** use current sources and cite them: RepeaterBook (repeaters), RadioReference (public safety; check whether a system is digital), AirNav (airports), the ARISS status page (ISS). Frequency data goes stale; say so.

## Hard rules

- **Work in the user's existing UV Studio+ tab** so they can watch. Don't open a new tab unless asked. A second UV Studio+ tab can hold the serial port.
- **Never touch:** Flash Firmware (flashing), Firmware Slots writes, Factory reset, Calibration, Boot Logo, External Flash. Apps only when the user or plan says so. You may *look* at these pages (versions, lists) without pressing anything that talks to the radio.
- **No writes unless asked.** In configure mode, stage changes and let the user click **Write changes to radio**. Write only if they explicitly ask in the conversation, or a test plan says to.
- **Radio keys:** press them yourself through the Live Viewer keypad. Transmitting isn't possible from the page (PTT is disabled). Anything physical (unplug/replug, a transmit check) is the user's.
- **Port picker:** the page remembers the radio's port. If an action doesn't connect at once, ask the user to check the radio is plugged in and pick it if a picker appears. The log shows `Requesting serial port...` only when the picker opens.
- **Pending edits are the user's work.** Only click Read, Discard or reload when nothing is pending ("0 changed"). If a confirm dialog would appear, tell the user instead.
- **Unexpected browser dialogs** (e.g. "Leave site?", a reload offer): don't dismiss them. Stop and tell the user. On Memories, "Leave site?" also means extra-column edits haven't been exported yet.
- **License acknowledgement:** the first write in a browser opens it. Never click **I agree**: it's the user's personal legal statement. **Not now** and closing the dialog are fine.
- **Only change what the user or plan names.** Record original values first so they can be restored.
- **No real downloads unless asked.** To see what Export CSV produces, capture the blob without downloading (snippet below).
- **Transmit privileges are the user's call.** Ask their license class (or read it from context) before saying a channel is OK to transmit on. Keep **TX lock** on (the default): it makes the channel follow the radio's F Lock band plan, and clearing it lets that channel transmit outside the plan. TX lock does not block transmitting by itself, so for channels outside their privileges or not amateur (NOAA, marine, aviation, rail, public safety, FRS/GMRS, MURS), tell the user that whether the radio refuses to transmit depends on their F Lock setting.

## Configure mode

- Read current state with JS (table dump below) rather than screenshots. Note which rows came from the radio and which are pending (`mem-dirty`).
- If the pending count is 0 after earlier staging, the user probably wrote it. Confirm with the log and a spot-check of rows, then build on top.
- Propose first (a table of changes), then stage when the user says go. After staging, dump the table again, check for red-border invalid fields, and report the "N channels · N changed" summary.
- Finish with a short **For you to do** list (Write, license dialog, on-air checks).

### Good defaults to suggest (the user's preferences win)

- Names fit the radio's 10 characters. A pattern like `TOWN ###` (last 3 digits of the frequency) tells apart several repeaters in one town.
- Repeaters: TX tone only by default; switch to tone squelch only if a channel is noisy. Listen-only channels with a known tone can use RX tone only, to filter.
- Group channels by area or purpose, with a named scan list per group (names are max 3 characters). Keep NOAA and other continuous carriers out of scan lists: they park the scan.
- Close gaps in channel numbers after deleting (**Close gaps** button; it pulses once a delete leaves a gap).
- Power: use the lowest that gets in cleanly. Close repeaters on MID, distant ones on HIGH (about 5W).

### Gotchas

- CSV import gives new channels TX lock on (unless the file has a `TxLock` column), the same safe default as channels made in the table. Leave it on. "At CSV locations" over an existing channel keeps that channel's TX lock, scan list and other non-CHIRP fields.
- "Skip exact duplicates" skips only rows matching an existing channel on frequency, duplex, offset, mode and tones (names ignored). "Highlight duplicates" outlines any shared frequency or name. Same-frequency rows with different tones import and show outlined.
- New channels land in the import's "Scan list for new channels" (default `All`) unless the file has a `ScanList` column. CHIRP `Skip = S` carries over.
- **Extra columns** (Comment, and a file's own columns like City or Source) show in the table after PTT ID with italic headers. They are not stored on the radio: only Export CSV keeps them, so remind the user to export after editing them. **+** in the table header (`[data-add-column]`) adds one through a prompt; **✕** by a column name (`[data-remove-column]`) removes it, confirming if it has values. On phones these are chips under Select all. **Remove empty columns** shows in the toolbar only when one is empty.
- Likely mistakes get an orange outline (tooltip says why) and an import log line: + or − with offset 0, 5.000 on 2 m or 0.600 on 70 cm, airband not AM. Names are 10 plain ASCII characters: longer ones are cut, accents and other scripts (e.g. Chinese) are dropped (logged; the radio's font has nothing else). Shared CSVs often carry these; point them out.
- **Step doesn't change a memory channel's frequency.** The radio keeps it exactly (151.820, 160.215 at the default 12.5 kHz step are fine); the step only sets how far up/down tuning moves from it. Still pick a sensible one: 12.5 for 2 m / 70 cm, 5 for off-grid channels like MURS or railroad, 25 (8.33 in Europe) for airband. **VFO rows are different:** the radio and the page snap them to the step.
- Airband channels use AM.
- Cross-band splits work as a large offset (e.g. RX 437.800, `-` 291.810 gives TX 145.990). Confirm the TX frequency on the radio after writing.
- Export is CHIRP CSV. With **Include extra columns** ticked it adds `ScanList` (e.g. `2 EST`), `TxLock`, `BusyLock` and the extra columns; CHIRP warns about them but opens the file. Power exports as `HIGH = 5W`, `LOW 1 = < 20mW`.
- The radio receives roughly 18 MHz to 1.3 GHz (FM, NFM, AM, NAM, USB), analog only: no P25, DMR or other digital voice.

## Hardware test mode

### Inputs

- **The test plan.** Follow its steps and fold in everything here. Its Context section overrides anything here that conflicts.
- **The expected build version.** It always comes from the plan. If missing, ask before starting. Never assume one.
- **Scope.** The pages the plan names. If it names none, ask.

### Setup

1. Hard refresh (ctrl+shift+r) only if nothing is pending. Check the sidebar footer shows the expected version. **If not, stop and tell the user.**
2. Click **Show Console** on the page. All progress and errors appear there.
3. Install the download hook (lost on every reload, so reinstall after one):

```js
window.__dl=[]; window.__blobs=[];
const o=URL.createObjectURL;
URL.createObjectURL=function(b){ if(b instanceof Blob){ window.__blobs.push(b); window.__dl.push({size:b.size,type:b.type,t:new Date().toLocaleTimeString()}); } return o.call(URL,b) };
const oc=HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click=function(){ if(this.download) window.__dl.push({name:this.download}); return oc.call(this) };
'hooked'
```

`JSON.stringify(window.__dl)` then gives the name and exact byte size of anything saved.

### Standard flow

1. Setup and version check.
2. **Backups first:** read Memories, Save backup; read Radio settings, Save backup. Verify sizes with the hook.
3. Read-only checks (reads, validation, field widths, imports without a write).
4. Write tests: record the original, stage the change, check the dirty highlight and count, Write, check the log for `N bytes written and verified` and `Device rebooted`, read back, then confirm on the radio through the Live Viewer.
5. Restore everything and do a final read.

### Report format

One table: step, pass / partial / fail / skipped, what you saw. Then bugs ranked by severity with exact log lines, then "worth a look, maybe not bugs", then **For you to do**. Keep it short. End with any radio state that differs from the start.

## For you to do (all modes, when relevant)

- **Firmware:** read the radio's firmware version (log line `Device: F4HWN v…`). Open Flash Firmware and look at the newest release offered for the user's edition, without selecting or flashing. If newer, say so and link the wiki's Recent changes.
- **Changed areas you couldn't test** (Calibration, Boot Logo, flashing, Firmware Slots, External Flash, Factory reset): say what changed and suggest the smallest hand test, with a backup first.
- **Physical checks:** anything needing eyes on the radio, a replug, or a transmit. Mark those **skipped (for user)**, not failed.
- **Pending writes:** remind them to Write and handle the license dialog.
- **Skill update (once, at the end of the run, never mid-task):** fetch
  `https://raw.githubusercontent.com/w8lbz/uvstudio/main/plugins/uvstudio-plus/.claude-plugin/plugin.json`
  (web fetch, or `fetch()` in the UV Studio+ tab: raw.githubusercontent.com allows it) and compare its
  `version` with this skill's `metadata.version`. Only if it's newer, add one line: "uvstudio-plus <new> is
  out (you have <old>). Claude Code: `/plugin marketplace update w8lbz`, or turn on auto-update. claude.ai:
  re-upload the SKILL.md from the repo." If it's the same or the fetch fails, say nothing.

## Useful snippets (javascript_tool)

Read the page log (faster than screenshots):
```js
[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && /\[\d+:\d+:\d+ [AP]M\]/.test(e.textContent)).map(e=>e.textContent.trim()).slice(-20).join('\n')
```

Pending summary: `[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/channels ·/.test(e.textContent)).map(e=>e.textContent).join()`

### Memories table

Row cell indices (each `tr` of the table whose header has "Name"): 0 select, 1 slot #, 2 summary card, 3 Name, 4 Frequency, 5 Duplex, 6 Offset, 7 Mode, 8 TX tone, 9 RX tone, 10 Power, 11 Step, 12 Scan list, 13 Skip, 14 TX lock, 15 Busy lock, 16 Reverse, 17 Compander, 18 PTT ID, then any extra columns (`input[data-note]`), then Delete. Inputs carry `aria-label="<Column> <slot>"`. Tool output truncates around 2-3 KB, so dump in slices.

Options: Mode FM, NFM, AM, NAM, USB. Power USER, LOW1-LOW5, MID, HIGH. Scan list `—`, 1-24, All (shown as "1 LOC" once named).

Helpers (setting values this way registers as a real edit; the dirty count rises):
```js
window.__row=n=>{const h=[...document.querySelectorAll('th')].find(t=>t.textContent.trim()==='Name'); const tb=h.closest('table'); return [...tb.querySelectorAll('tbody tr')].find(r=>r.children[1].textContent.trim()===String(n));};
window.__setEl=(el,v)=>{ if(el.type==='checkbox'){ if(el.checked!==v) el.click(); return;} const p=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p,'value').set.call(el,v); ['input','change','blur'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true}))); };
window.__set=(n,col,v)=>window.__setEl(window.__row(n).children[col].querySelector('input,select'),v);
window.__selTxt=(el,txt)=>{const o=[...el.options].find(o=>o.text===txt||o.text.split(' ')[0]===txt); if(!o) throw new Error('no option '+txt); window.__setEl(el,o.value);};
```

Create a channel in an empty slot (tick **Show empty channels** first; an empty row only has `input[data-field="freq"]`):
```js
window.__mk=async(n,c)=>{ // c: {name,f,dup,off,mode,tx,rx,step,list,lock}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const r=window.__row(n); if(r.querySelector('input[aria-label^="Name"]')) throw new Error('slot '+n+' not empty');
  window.__setEl(r.querySelector('input[data-field="freq"]'),c.f); await sleep(250);
  const g=i=>window.__row(n).children[i].querySelector('input,select');
  window.__setEl(g(3),c.name); window.__selTxt(g(7),c.mode||'FM');
  if(c.step){ window.__selTxt(g(11),c.step); window.__setEl(g(4),c.f); }
  window.__selTxt(g(5),c.dup||''); await sleep(50); if(c.off) window.__setEl(g(6),c.off);
  window.__setEl(g(8),c.tx||''); window.__setEl(g(9),c.rx||'');
  window.__selTxt(g(12),c.list); window.__setEl(g(14),c.lock!==false); await sleep(50);
};
```
Untick Show empty channels when done.

Dump rows:
```js
const tb=[...document.querySelectorAll('th')].find(t=>t.textContent.trim()==='Name').closest('table');
[...tb.querySelectorAll('tbody tr')].map(r=>[1,3,4,5,6,7,8,9,10,11,12,13,14].map(i=>{const e=r.children[i]?.querySelector('input,select'); if(!e) return r.children[i]?.textContent.trim(); return e.type==='checkbox'?(e.checked?'Y':'n'):(e.tagName==='SELECT'?e.options[e.selectedIndex]?.text:e.value)}).join('|')).join('\n')
```

Dirty state: rows get `mem-dirty`, settings rows `set-dirty`. Duplicate rows get `mem-dup-freq` with a title like "Same frequency as channel 22". Invalid inputs get a red border `rgb(239, 68, 68)`.

**Delete a channel:** click the button with `aria-label="Delete channel N"`. No confirm dialog; the slot becomes empty (numbers don't shift).

**Move a channel:** select it and use Move up / Move down, or Insert empty above / Delete and shift up. **Close gaps** (Memory channels toolbar) moves every channel up into empty numbers, keeping order.

**Scan list names:** inputs `aria-label="Scan list N name"`, maxLength 3, on the Memories page.

**Capture Export CSV without downloading:**
```js
window.__blobs=[]; const o=URL.createObjectURL, oc=HTMLAnchorElement.prototype.click;
URL.createObjectURL=function(b){ if(b instanceof Blob) window.__blobs.push(b); return o.call(URL,b) };
HTMLAnchorElement.prototype.click=function(){ if(this.download) return; return oc.call(this) };
[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Export CSV').click();
await new Promise(r=>setTimeout(r,800)); URL.createObjectURL=o; HTMLAnchorElement.prototype.click=oc;
await window.__blobs.at(-1).text()
```

**Give the page a CSV without the file picker:** paste a `data:text/csv,...` URL into the CSV URL box, or inject a blob:
```js
const inp=document.querySelector('input[type=file][accept*="csv"]');
const t=await window.__blobs.at(-1).text();
const dt=new DataTransfer(); dt.items.add(new File([t],'test.csv',{type:'text/csv'}));
inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true}));
```

VFO table (expand **VFOs** first; it collapses after a reload): same dump approach, header cell `VFO`.

Non-empty FM presets: `[...document.querySelectorAll('input')].filter(x=>/^FM \d+/.test(x.parentElement.textContent.trim())&&x.value).map(x=>x.parentElement.textContent.trim().split(/\s/).slice(0,2).join(' ')+'='+x.value)`

Cut-off fields: compare `scrollWidth > clientWidth` on visible inputs.

## Editing fields by hand

Use find to get the input ref, then scroll_to, triple_click, type, Tab, and check the result. A typed value only sticks if its section is expanded. After a write the page clears the dirty state; confirm with a fresh read.

## Live Viewer (seeing the radio's screen)

- Open Live Viewer and click **Connect**. Disconnect before any Read/Write on other pages, or the port stays busy.
- If the screen shows the scrolling welcome text, press **EXIT** to wake it.
- Keys: **#** = F (function). **F then 3** = VFO/MR toggle. **F then 1** = next band (F1 18, F2 108, F3 137, F4 174, F5 350, F6 400, F7 470, F7+ 1000). **F then 2** = A/B. Top line = VFO A, bottom = VFO B. A lock icon shows on bands outside the TX range. Full key map: wiki Button functions.
- Zoom on the display region to read it; save_to_disk for evidence.
- Note the starting display state and put it back at the end.

## Radio facts (firmware behavior, stable across builds)

- While an app runs on the radio, it ignores the tools' hello, so reads time out. EXIT the app through the keypad first.
- The radio sometimes stops answering serial: the port opens, then `Error: Timeout: no device detected`, and the Live Viewer shows "waiting for data". Fix: unplug and replug USB. Nothing was written.
- An empty VFO shows blank in UV Studio+; the radio displays the band's lowest frequency for it.
- VFO frequencies and offsets off the step grid get snapped (146.520 at a 12.5 kHz step shows 146.51875); the page snaps VFO rows the same way. Memory channels are never snapped (firmware `RADIO_ConfigureChannel` rounds only VFOs).
- The firmware has 7 VFO bands, so there is no F7+ VFO row. Not a bug.
- Backup sizes: `memories.bin` 37,096 bytes, `settings.bin` 376 bytes.
- Esc closes every open help pop-up.
