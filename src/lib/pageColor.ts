const RELEASE_DELAY_MS = 150;

let releaseTimer: ReturnType<typeof setTimeout> | undefined;

export const setPageColor = (color: string | null | undefined) => {
  clearTimeout(releaseTimer);
  const { style } = document.documentElement;
  if (color) style.setProperty("--color-page", color);
  else style.removeProperty("--color-page");
};

export const releasePageColor = () => {
  clearTimeout(releaseTimer);
  releaseTimer = setTimeout(
    () => document.documentElement.style.removeProperty("--color-page"),
    RELEASE_DELAY_MS,
  );
};

export const resetPageColor = () => {
  clearTimeout(releaseTimer);
  const root = document.documentElement;
  if (!root.style.getPropertyValue("--color-page")) return;
  root.dataset.pageColorInstant = "";
  root.style.removeProperty("--color-page");
  getComputedStyle(root).getPropertyValue("--color-page");
  delete root.dataset.pageColorInstant;
};

export const pageColorOnHover =
  (color: string | null | undefined) => (node: HTMLElement) => {
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setPageColor(color);
    };
    const onFocusIn = () => setPageColor(color);

    node.addEventListener("pointerenter", onPointerEnter);
    node.addEventListener("focusin", onFocusIn);
    node.addEventListener("pointerleave", releasePageColor);
    node.addEventListener("focusout", releasePageColor);

    return () => {
      node.removeEventListener("pointerenter", onPointerEnter);
      node.removeEventListener("focusin", onFocusIn);
      node.removeEventListener("pointerleave", releasePageColor);
      node.removeEventListener("focusout", releasePageColor);
    };
  };

export const pageColorOnFocus = (node: HTMLElement) => {
  const touchOnly = matchMedia("(hover: none)");
  let frame = 0;

  const closest = <T extends Element>(
    items: Iterable<T>,
    distance: (rect: DOMRect) => number,
  ) => {
    let best: T | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const d = Math.abs(distance(item.getBoundingClientRect()));
      if (d < bestDistance) {
        bestDistance = d;
        best = item;
      }
    }
    return best;
  };

  const update = () => {
    frame = 0;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress =
      maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
    const focusY = window.innerHeight * (0.3 + 0.4 * progress);
    const track = closest(
      node.querySelectorAll<HTMLElement>("[data-focus-track]"),
      (rect) => rect.top + rect.height / 2 - focusY,
    );
    if (!track) return;
    const start =
      track.getBoundingClientRect().left +
      Number.parseFloat(getComputedStyle(track).paddingInlineStart);
    const item = closest(
      track.querySelectorAll<HTMLElement>("[data-focus-item]"),
      (rect) => rect.left - start,
    );
    if (item) setPageColor(item.dataset.pageColor);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const listen = () => {
    window.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", schedule);
  };

  const unlisten = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("scroll", schedule, { capture: true });
    window.removeEventListener("resize", schedule);
  };

  const onModeChange = () => {
    unlisten();
    if (touchOnly.matches) {
      listen();
      schedule();
    } else {
      releasePageColor();
    }
  };

  onModeChange();
  touchOnly.addEventListener("change", onModeChange);

  return () => {
    unlisten();
    touchOnly.removeEventListener("change", onModeChange);
  };
};

export const resolveColorToken = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();

  const context = document.createElement("canvas").getContext("2d");
  if (!context) return "#000000";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};
