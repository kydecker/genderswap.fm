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

const closest = <T>(items: Iterable<T>, distance: (item: T) => number) => {
  let best: T | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const d = Math.abs(distance(item));
    if (d < bestDistance) {
      bestDistance = d;
      best = item;
    }
  }
  return best;
};

const visibleFraction = (element: Element) => {
  const { top, bottom, height } = element.getBoundingClientRect();
  if (!height) return 0;
  const visible = Math.min(bottom, window.innerHeight) - Math.max(top, 0);
  return Math.max(0, visible) / height;
};

export const pageColorOnFocus = (node: HTMLElement) => {
  const touchOnly = matchMedia("(hover: none)");
  let frame = 0;
  let track: HTMLElement | undefined;
  let trackFraction = 0;
  let focused: HTMLElement | undefined;

  const pickTrack = () => {
    const tracks = [
      ...node.querySelectorAll<HTMLElement>("[data-focus-track]"),
    ];
    const fractions = tracks.map(visibleFraction);
    const index = track ? tracks.indexOf(track) : -1;
    const fraction = fractions[index] ?? 0;
    const max = Math.max(...fractions);
    const next =
      index < 0 || (fraction < trackFraction && fraction < max)
        ? closest(
            [...fractions.keys()].filter((i) => fractions[i] === max),
            (i) => i - Math.max(index, 0),
          )
        : index;
    if (next === undefined) return;
    track = tracks[next];
    trackFraction = fractions[next];
  };

  const update = () => {
    frame = 0;
    pickTrack();
    if (!track) return;
    const start =
      track.getBoundingClientRect().left +
      Number.parseFloat(getComputedStyle(track).paddingInlineStart);
    const item = closest(
      track.querySelectorAll<HTMLElement>("[data-focus-item]"),
      (item) => item.getBoundingClientRect().left - start,
    );
    if (!item || item === focused) return;
    focused = item;
    setPageColor(item.dataset.pageColor);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onResize = () => {
    if (focused) schedule();
  };

  const onScroll = (event: Event) => {
    const { target } = event;
    if (
      target instanceof HTMLElement &&
      target.matches("[data-focus-track]") &&
      node.contains(target)
    ) {
      track = target;
      trackFraction = 0;
    }
    schedule();
  };

  const unlisten = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("scroll", onScroll, { capture: true });
    window.removeEventListener("resize", onResize);
  };

  const onModeChange = () => {
    unlisten();
    track = undefined;
    focused = undefined;
    if (touchOnly.matches) {
      window.addEventListener("scroll", onScroll, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", onResize);
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
