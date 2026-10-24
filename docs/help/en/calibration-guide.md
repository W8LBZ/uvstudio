> 💡 **TL;DR:** Calibration is a small block of factory-measured data, unique to **your** radio, that keeps its power, frequency and signal meter accurate. Back it up once and keep the file safe. Only restore it to the same radio.

### Back up
- With the radio in normal mode, press **Read calibration data**, then download `calibration.dat`.
- Do this before flashing other firmware, and keep a copy somewhere safe. A lost calibration can't be recreated at home.

### Restore
- Only restore a backup taken from **this same radio**.
- Another radio's calibration makes transmit power, frequency accuracy, battery reading and the S-meter wrong, and can make the radio transmit off frequency.
- Restore when going back to stock firmware, or if the calibration area was damaged.

### When not to touch it
If your radio works and you have a backup, there's nothing to do here.

Read more: [F4HWN firmware: calibration](https://github.com/armel/uv-k1-k5v3-firmware-custom#steps-to-dump-or-restore-calibration-data)
