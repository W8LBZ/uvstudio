> 💡 **TL;DR:** Squelch keeps the speaker quiet until a signal is strong enough. Tones (CTCSS/DCS) add a second check: the right code must be present too.

### Squelch
- The radio's **[Sql](settings-radio.md#sql)** setting sets how strong a signal must be to open the speaker.
- Constant hiss: squelch too low. Weak stations cutting out: squelch too high.

### Tones
- **[TX tone](tx-tone.md)** is a code you send, usually to open a repeater.
- **[RX tone](rx-tone.md)** is a code you require before you hear anything.
- **CTCSS** tones are numbers like `88.5`. **DCS** codes look like `D023N`.

### Troubleshooting
- **You hear nothing on a busy channel**: clear the RX tone, or lower Sql.
- **The repeater ignores you**: check the TX tone and the [offset](offset.md).
- **You hear other groups on your channel**: set an RX tone that matches your group.
- Tones don't make a conversation private. Anyone without a tone set hears everything.

Read more: [CTCSS](https://en.wikipedia.org/wiki/Continuous_Tone-Coded_Squelch_System) · [Squelch](https://en.wikipedia.org/wiki/Squelch)
