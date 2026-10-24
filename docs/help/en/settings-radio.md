**TL;DR:** How the radio receives, transmits and sounds. If you're new, the defaults are fine. **Sql** is the one most people change.

### Sql
Squelch: how strong a signal must be before the speaker opens. **0** is always open (constant hiss). Higher numbers stay quieter but can cut off weak stations. 3 to 5 suits most people.

### TxTOut
Transmit time-out: the longest one press of PTT can transmit, from 30 seconds to 15 minutes. When time runs out the radio stops transmitting by itself (see **SetTOT** under Transmit for the warning).
- Protects against a stuck PTT or a radio keyed in a bag.
- Many repeaters cut off after about 3 minutes anyway, so 2 to 3 minutes is a sensible choice.

### Mic
Microphone gain, from **+1.5 dB** (quietest) to **+31.5 dB** (loudest). Raise it if people say you sound quiet; lower it if they say you sound distorted or "hot". Change one step at a time and ask for a signal report. **MicBar** (under Display) shows your level while you talk.

### VOX
Voice-operated transmit: talking into the radio starts a transmission without pressing PTT, and it stops shortly after you go quiet.
- **OFF** (recommended to start): you always press PTT.
- **1–10**: how loud a sound must be to start transmitting. If it keys up on background noise or breathing, change the level one step; if it misses the start of your words, go the other way.
- VOX can transmit by accident (a cough, a loud room). Turn it off when you put the radio down.

### RxMode
How the radio listens with its two VFOs (A and B):
- **MAIN ONLY**: listen to the selected VFO only.
- **DUAL RX RESPOND**: watch both, and transmit on whichever one last received.
- **CROSS BAND**: listen on one VFO, always transmit on the other.
- **MAIN TX DUAL RX**: watch both, always transmit on the selected one.
- **FULL RX RESPOND**: watch A, B and the two priority channels (**PriCh1**, **PriCh2** under Scan), and reply on whichever one received.
- **MAIN TX FULL RX**: watch all of those, always transmit on the selected VFO.
- The two FULL modes aren't in every firmware edition.

### BatSav
Battery saver. When the radio sits idle on its main screen for about 10 seconds, the receiver starts napping: it wakes for 0.1 s to check for a signal, then sleeps for a while, over and over.
- The number after **1:** is how long it sleeps for each 0.1 s awake: **1:1** sleeps 0.1 s, **1:2** 0.2 s … **1:5** 0.5 s.
- Higher saves more battery (at 1:5 the receiver is off most of the time), but the radio can take up to that long to notice a call, so the first word may get cut off.
- **OFF**: the receiver never naps. Uses the most battery, misses nothing.
- It only naps when nothing's happening: not while receiving, scanning, transmitting, in a menu or listening to FM broadcast.
- **1:4** is the firmware's default and a good balance.

### BatTyp
Which battery pack is fitted, so the battery gauge reads correctly.

### 1 Call
A favorite channel the radio jumps to with a one-key shortcut on the **9** key.

### Roger
A sound sent when you release PTT. **ROGER** is a short beep. **MDC** sends an MDC-1200 data burst, used by some commercial systems. **OFF** is normal for ham use.

### STE
Squelch tail elimination: at the end of a transmission, the radio sends a signal telling other radios using a tone to mute right away, so they don't hear a burst of noise. Only helps when a TX tone is set.

### RP STE
Repeater squelch tail elimination: after you release PTT, the radio keeps transmitting this long while sending the tail signal, so repeaters that support it close without a noise burst. **OFF** is normal unless your repeater asks for it.

### SetNFM
How narrow NFM channels are: **NARROW** (standard 12.5 kHz) or **NARROWER** (tighter still). Leave on NARROW unless you know you need it.

### SetRxA FM
Receive audio shaping for FM: from **FLAT** (unchanged) to **MAX** (louder, more processed). Pick what sounds clearest to you.

### SetRxA AM
Receive audio filter for AM: **SHARP** cuts more noise, **OPEN** lets more audio through, **STOCK** is in between.
