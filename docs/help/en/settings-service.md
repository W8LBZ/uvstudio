> 💡 **TL;DR:** The radio's hidden Service menu: which frequencies it may transmit on, and the 350–400 MHz band. Leave these alone unless you know exactly why you're changing them.

⚠️ These settings decide where the radio is allowed to transmit. Changing them doesn't change what your license allows. You're responsible for transmitting only where you're authorized. See [Bands and licensing](bands-and-licensing.md).

### F Lock
The transmit band plan. Channels with **TX lock** checked (the default) can only transmit inside it; receiving works everywhere.

| Option | Transmit allowed on (MHz) |
|---|---|
| DEFAULT+ | 137–350 and 400–600, plus 350–400 when **350 En** is on |
| FCC HAM | 144–148 and 420–450 (US amateur) |
| CA HAM | 144–148 and 430–450 (Canada amateur) |
| CE HAM | 144–146 and 430–440 (Europe amateur) |
| GB HAM | 144–148 and 430–440 (UK amateur) |
| 137-174, 400-430 / 400-438 | 137–174 and 400–430 or 400–438 |
| PMR 446 | 446.00625–446.19375 |
| GMRS FRS MURS | 462.550–462.725, 467.550–467.725 and the five MURS channels |
| DISABLE ALL | nothing: receive only |
| UNLOCK ALL | every frequency the radio can tune |

- **DEFAULT+**: the radio's own label ("137-174, 400-470") is narrower than what the firmware really allows; the table shows the real ranges.
- With a US amateur license, **FCC HAM** keeps you inside the bands you may use.
- **GMRS FRS MURS** only limits frequencies. GMRS and FRS normally require a radio certified for that service, which this radio generally isn't, even with a GMRS license. It doesn't limit power or channel width either.
- **UNLOCK ALL** removes every limit.
- F Lock applies only to memories with **TX lock** on (the default). A memory with TX lock off can transmit outside the band plan, for example one simplex channel outside FCC HAM.

### 350 En
Turns the 350–400 MHz band on or off. **OFF**: the radio skips that band and moves any channel in it to 433.000 MHz. **ON** (default): the radio receives there and, with F Lock on **DEFAULT+**, can transmit there too.

Read more: [TX lock](tx-lock.md) · [Bands and licensing](bands-and-licensing.md)
