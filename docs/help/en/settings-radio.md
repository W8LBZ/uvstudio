**TL;DR:** How the radio receives, transmits and sounds. If you're new, the defaults are fine. **Sql** is the one most people change.

### Sql
Squelch: how strong a signal must be before the speaker opens. **0** is always open (constant hiss). Higher numbers stay quieter but can cut off weak stations. 3 to 5 suits most people.

### TxTOut
Transmit time-out: the longest one press of PTT can transmit before the radio stops by itself. It protects against a stuck button, and many repeaters time out after about 3 minutes anyway.

### Mic
Microphone gain. Raise it if people say you're quiet, lower it if they say you're distorted.

### VOX
Voice-operated transmit: talking starts a transmission without pressing PTT. **OFF** is safest. Higher numbers need louder sound to trigger it.

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
Battery saver: the receiver sleeps part of the time while idle. **1:5** saves the most but can clip the first syllable of a call. **OFF** never sleeps.

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
