> 💡 **TL;DR:** Read from the radio, edit the table, then write the changes back. Nothing reaches the radio until you press **Write changes to radio**, so you can experiment freely until then.

### Read and write
- **Read from radio** loads all 1024 channels, the VFOs and the scan list names into the page.
- Edit as much as you like. The summary counts your changes, and edited cells are highlighted.
- **Write changes to radio** sends only what changed, then restarts the radio so it picks them up.
- **Undo** steps back one change at a time.
- **Discard changes** puts everything back the way it is on the radio. It doesn't ask first: if you discarded by mistake, Undo brings the changes back.
- Save a backup first (below), especially before a big import.

### Backups (.bin)
- **Save backup (.bin)** stores an exact copy of the radio's memory area: channels, names, scan lists and VFOs.
- **Open backup (.bin)** (under **Import and export**) loads one into the table. Press Write to put it on the radio.
- Use backups to undo mistakes. They only fit UV-K1 / UV-K5 V3 radios on F4HWN firmware.

### Import and export CSV
These buttons are under **Import and export**. CSV files use the CHIRP format, so you can share channel lists with CHIRP users, spreadsheets, and sites like RepeaterBook.
- **Export CSV** saves the channels as a CSV file.
- Importing takes three steps:
  1. **Choose CSV file**, or paste a web address (or pick a list from the suggestions) and press **Load from URL**. The line below shows which CSV is ready. Nothing changes yet.
  2. Pick where the rows go in the menu, and tick **Skip duplicates** if you want.
  3. Press **Import into table**. The channels appear in the table, and **Write changes to radio** pulses until you write them. The radio is not touched until you do.
- Where the rows go:
  - **At CSV locations**: each row goes to the channel number in its Location column. Other channels stay as they are.
  - **Append**: rows go after your last used channel, in file order.
  - **Prepend**: rows go at the top (from channel 1), and your existing channels move down.
  - **Replace all**: every channel is cleared first, then rows go to their locations.
- **Skip duplicates** leaves out rows with the same frequency, duplex, offset, mode and tones as a channel you already have. Names are ignored when comparing.

### Show empty channels
Shows unused channel numbers too, so you can type a new channel into a specific slot.

### Sort by
Lists the channels by channel number, frequency or name. This only changes the order on this page: channel numbers on the radio stay the same. Move up, Move down and Insert empty above work on channel numbers, so they are off while another order is shown.

### Duplicates
A frequency or name used by more than one channel gets an orange outline. Hover over it to see which other channels use it. Duplicates are allowed (for example one repeater with two tones); the outline is only a reminder. Untick **Highlight duplicates** to hide it.

### Editing several channels
Tick the boxes on the left to select channels. A bar appears with:
- **Move up** / **Move down**: reorder the selection.
- **Insert empty above**: make room, pushing the following channels down.
- **Delete and shift up**: remove the selection and close the gap.
- **Copy** / **Paste**: duplicate channels to another place.
- **Set for selected**: change one column (for example Power) on every selected channel at once.

### Scan list names
- Opens with the **Scan list names** button above the table.
- Give each of the 24 scan lists a short name, such as **RPT** or **AIR**. The radio only shows 3 characters.
- The names help you on the radio's screen. Which list a channel belongs to is set in the [Scan list](scan-list.md) column.

### VFOs
The **VFOs** section, after **Memory channels**, is the radio's own record of where you left each band when tuning by frequency (VFO mode) rather than using memory channels.
- The radio has 7 fixed bands and two VFOs (A and B), so there are 14 rows, one per band per VFO.
- Each row holds what that VFO had set in that band: frequency, offset, tones, power, TX lock and so on. Switch back to the band and the radio picks up from that row.
- **The radio fills this table itself.** Every time you tune or change a setting in VFO mode, it saves the change to the matching row. **Read from radio** shows what it saved.
- **You can edit it too.** Edit a row, press **Write changes to radio**, and the radio starts from your values, until you change them on the radio again.
- A row is a saved spot, not a rule for the whole band. To keep a frequency for good, put it in a memory channel.

See [VFO](vfo.md).
