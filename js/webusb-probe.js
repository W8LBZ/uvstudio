/* Throwaway WebUSB probe for Android support testing. Only active with ?webusbprobe in the URL.
 * Delete this file and its script tag once the Pixel test is done. */
(function () {
    if (!new URLSearchParams(window.location.search).has("webusbprobe")) return;

    const bar = document.querySelector("#pane-viewer .viewer-bar");
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "WebUSB probe";
    document.getElementById("connectionBtn").after(btn);

    const panel = document.createElement("div");
    panel.style.cssText = "padding:8px 0;display:grid;gap:6px";
    panel.innerHTML = '<textarea readonly rows="10" style="width:100%;font:12px monospace;background:var(--surface);color:inherit;border:1px solid var(--border)"></textarea>'
        + '<button class="btn" type="button">Copy log</button>';
    bar.after(panel);
    const out = panel.querySelector("textarea");
    const log = line => { out.value += line + "\n"; };

    panel.querySelector("button").addEventListener("click", () => {
        out.select();
        (navigator.clipboard ? navigator.clipboard.writeText(out.value) : Promise.reject())
            .then(() => log("(copied)"), () => document.execCommand("copy"));
    });

    async function webusbProbe() {
        log(navigator.userAgent);
        if (!navigator.usb) return log("WebUSB not available");
        const hex = n => "0x" + n.toString(16).padStart(4, "0");
        const dev = await navigator.usb.requestDevice({ filters: [] });
        await dev.open();
        if (dev.configuration === null) await dev.selectConfiguration(1);
        log(`${dev.manufacturerName} / ${dev.productName}  VID ${hex(dev.vendorId)} PID ${hex(dev.productId)}`);
        for (const i of dev.configuration.interfaces) {
            const a = i.alternate;
            log(`if ${i.interfaceNumber} class ${a.interfaceClass}: `
                + a.endpoints.map(e => `${e.direction} ${e.type} #${e.endpointNumber}`).join(", "));
        }
        try { await dev.claimInterface(0); log("claimInterface(0) OK"); }
        catch (e) { log("claimInterface(0) failed: " + e.message); }
        await dev.close();
    }

    btn.addEventListener("click", () => webusbProbe().catch(e => log(`${e.name}: ${e.message}`)));
})();
