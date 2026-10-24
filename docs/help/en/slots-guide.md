> 💡 **TL;DR:** Multiboot lets the radio store several firmware versions and pick one at power-on. Writing a slot doesn't change the firmware you're running now.

### Using slots
- Press **Refresh slots** to see what's stored. There's a protected **Main** backup plus four user slots.
- To fill a slot, choose a multiboot-compatible F4HWN firmware (from the list or a file), pick the target slot, then **Write to slot**.
- **Erase** removes a slot. **Reset config** clears that slot's own settings bank.

### Switching firmware
Switch the radio off, hold **MENU**, switch it on, and release when the selector appears. Use **UP**/**DOWN** to choose, **MENU** to start it, **EXIT** to leave.

> ⚠️ Never switch off while a slot is being restored.

### Settings banks
Each slot has its own bank of channels and settings, so firmwares don't overwrite each other's setup.

Read more: [F4HWN firmware: Multiboot](https://github.com/armel/uv-k1-k5v3-firmware-custom#multiboot-and-multiconfig)
