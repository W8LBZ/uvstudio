**TL;DR:** A filter for your own speaker. The radio stays silent until it hears a signal carrying this code.

- Nothing is sent, and repeaters don't care about it. It only changes what *you* hear.
- **Blank** (most common): you hear everything on the frequency.
- **Set**: you only hear stations sending this code. Other users on the same frequency stay quiet.
- Many repeaters send their tone back out, so setting RX tone to the same value as [TX tone](tx-tone.md) means you hear only that repeater.
- If you hear nothing on a channel that should be active, try clearing RX tone first.
- Formats are the same as TX tone: `88.5` for CTCSS, `D023N` / `D023I` for DCS.

Read more: [CTCSS](https://en.wikipedia.org/wiki/Continuous_Tone-Coded_Squelch_System) · [Squelch](https://en.wikipedia.org/wiki/Squelch) · [CHIRP: memory editor columns](https://chirpmyradio.com/projects/chirp/wiki/MemoryEditorColumns)
