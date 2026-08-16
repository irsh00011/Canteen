export type FlyRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
};

type Viewport = { width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function getFlyTarget(cart: FlyRect | undefined, viewport: Viewport) {
  const safeBottom = viewport.height - 150;
  const cartIsVisible = Boolean(cart && cart.top < viewport.height && cart.bottom > 0);

  if (!cart || !cartIsVisible) {
    return { x: Math.round(viewport.width / 2), y: Math.max(92, safeBottom) };
  }

  return {
    x: clamp(cart.left + Math.min(cart.width * 0.72, cart.width - 44), 44, viewport.width - 44),
    y: clamp(cart.top + Math.min(48, Math.max(12, cart.height / 2)), 68, viewport.height - 24),
  };
}
