const targetList = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const target = targetList.find((entry) => entry.type === "page" && entry.url.includes("3000-i18wnq9t2mpodn1ttnp02-ab7abf1b.sg1.manus.computer"));

if (!target?.webSocketDebuggerUrl) {
  throw new Error("The KBA Canteen preview tab is not available for mobile verification.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

socket.addEventListener("message", ({ data }) => {
  const response = JSON.parse(data);
  if (!response.id) return;
  const callback = pending.get(response.id);
  if (!callback) return;
  pending.delete(response.id);
  if (response.error) callback.reject(new Error(response.error.message));
  else callback.resolve(response.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

try {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  const result = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        document.getElementById('kba-mobile-fly-inspection')?.remove();
        const style = document.createElement('style');
        style.id = 'kba-mobile-fly-inspection';
        style.textContent = '.product-fly { animation-duration: 10000ms !important; } .current-bill { transform: translateY(900px) !important; }';
        document.head.appendChild(style);
        const product = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('Tea'));
        if (!(product instanceof HTMLButtonElement)) return { error: 'Tea product button not found' };
        product.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const fly = document.querySelector('.product-fly');
        const dock = document.querySelector('.cart-fly-target');
        if (!(fly instanceof HTMLElement) || !(dock instanceof HTMLElement)) return { error: 'Flight or cart anchor was not rendered' };
        const source = { left: Number.parseFloat(fly.style.left), top: Number.parseFloat(fly.style.top) };
        const landing = {
          left: Math.round(source.left + Number.parseFloat(fly.style.getPropertyValue('--fly-dx'))),
          top: Math.round(source.top + Number.parseFloat(fly.style.getPropertyValue('--fly-dy'))),
        };
        const anchor = dock.getBoundingClientRect();
        const verification = {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          anchorVisible: getComputedStyle(dock).opacity,
          landing: {
            inside: landing.left >= anchor.left && landing.left <= anchor.right && landing.top >= anchor.top && landing.top <= anchor.bottom,
            point: landing,
            anchorBounds: { left: Math.round(anchor.left), top: Math.round(anchor.top), right: Math.round(anchor.right), bottom: Math.round(anchor.bottom) },
          },
        };
        style.remove();
        return verification;
      })()
    `,
  });
  console.log(JSON.stringify(result.result.value, null, 2));
} finally {
  await send("Emulation.clearDeviceMetricsOverride");
  socket.close();
}
