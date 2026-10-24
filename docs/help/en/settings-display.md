**TL;DR:** What the screen shows and how the backlight behaves. Nothing here affects radio performance, so experiment freely.

### ChDisp
How memory channels appear: frequency, channel number, name, or name with frequency underneath.

### POnMsg
What happens at power-on: a sound, your messages, the battery voltage, the boot logo, everything (**ALL**), or nothing.

### Message 1
First line of the power-on message (up to 16 characters). Your call sign is a popular choice.

### Message 2
Second line of the power-on message (up to 16 characters), shown under **Message 1** when **POnMsg** includes messages.

### BLTime
How long the backlight stays on after a key press. **OFF** never lights. **ON** stays lit always and uses the most battery.

### BLMin
Backlight brightness while the light is "off" (after **BLTime** runs out), from **0** (fully dark, saves the most battery) to **9**. A low value like 1 keeps the screen readable at night.

### BLMax
Backlight brightness while the light is on, from **1** to **10** (brightest). Lower values save battery and are easier on the eyes in the dark.

### BLTxRx
Also light the screen while transmitting (**TX**), receiving (**RX**), or both.

### BatTxt
Show the battery as a voltage, a percentage, or not at all on the status bar.

### MicBar
Show a microphone level bar while transmitting, so you can see how loudly you're talking.

### SetCtr
Screen contrast. Raise it if text looks faint, lower it if the background looks grey.

### SetInv
Invert the screen: light text on a dark background.

### SetMet
Style of the S-meter, the bar that shows how strong the received signal is. **TINY** is a compact bar that leaves more room for other information; **CLASSIC** is the larger traditional meter. Purely a matter of taste.

### SetGUI
Layout of the frequency (VFO) screen. **TINY** uses smaller text to fit more details such as power, tones and step; **CLASSIC** keeps the larger, simpler layout. Try both and keep what reads best.

### SetSav
Screensaver. When the backlight times out (see **BLTime**), the screen shows a picture instead of the frequency display:
- **OFF**: no screensaver; the normal display stays, just unlit.
- **LOGO**: your boot logo (you can change it on the Boot logo page).
- **LOGO+**: the boot logo, slowly scrolling sideways.
- **MATRIX**: falling "digital rain" characters, like the film.

Any key press, or an incoming signal, brings the normal display back. The key press that wakes the screen does nothing else, so you can't change a setting by accident. It needs a **BLTime** that isn't OFF or ON, because it waits for the backlight to time out.
