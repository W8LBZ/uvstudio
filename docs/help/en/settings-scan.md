> 💡 **TL;DR:** How scanning picks channels, and what happens when it finds a signal.

### ScList
Which scan list the radio scans: one list (**01** to **24**), **ALL** channels, or **MIX** (the lists ticked in **ScMix**). A channel's list is set in the Memories table.

### ScPri
Priority scan: while scanning, the radio keeps checking the priority channels (**PriCh1**, **PriCh2**) so you don't miss them.

### PriCh1
First priority channel, checked often while scanning when **ScPri** is ON. The FULL RX modes (**RxMode** under Radio) watch it too.

### PriCh2
Second priority channel. It works exactly like **PriCh1**: checked often while scanning when **ScPri** is ON, and watched by the FULL RX modes.

### ScnRev
What scanning does when it finds a signal:
- **STOP**: stop there until you restart the scan.
- **CARRIER**: wait until the signal ends, plus the time shown, then carry on. Best for conversations.
- **TIMEOUT**: listen for the time shown, then carry on even if the signal is still there.

### SetScn
Scan speed. **FAST** checks channels quicker but may miss very weak or very short signals. **NORMAL** is more thorough.

### ScMix
The scan lists that make up **MIX** in **ScList**. Tick the lists you want scanned together.
