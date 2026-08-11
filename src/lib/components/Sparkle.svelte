<div class="sparkle">
  <div class="sparkle-lines">
    <svg
      width="520"
      height="520"
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path class="vertical" d="M260 20L284 260L260 500L236 260L260 20Z" fill="currentColor" />
      <path class="horizontal" d="M500 260L260 284L20 260L260 236L500 260Z" fill="currentColor" />
    </svg>
  </div>
</div>

<style>
  @keyframes grow-and-shrink {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(-360deg);
    }
    100% {
      transform: rotate(270deg);
    }
  }

  @keyframes scaleX {
    0% {
      transform: scaleX(0.3);
    }
    50% {
      transform: scaleX(1);
    }
    100% {
      transform: scaleX(0.3);
    }
  }

  @keyframes scaleY {
    0% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.3);
    }
    100% {
      transform: scaleY(1);
    }
  }

  .sparkle {
    --sparkle-size: calc(var(--space-3xl) * 3);

    position: absolute;
    top: calc((var(--sparkle-size) / -2) + var(--space-s));
    left: calc(50% - (var(--sparkle-size) / 2));
    width: var(--sparkle-size);
    height: var(--sparkle-size);
    pointer-events: none;
    animation: 1s grow-and-shrink ease-in-out both;
    animation-delay: 0.4s;
    color: var(--pink-9);
  }

  .sparkle-lines {
    position: absolute;
    animation: 1s spin cubic-bezier(0.21, 0.87, 0.85, 0.1) both;
    animation-delay: 0.4s;
  }

  svg {
    * {
      transform-box: fill-box;
      transform-origin: center;
    }
  }

  .vertical {
    animation: 1s scaleY ease-in-out both;
    animation-delay: 0.4s;
  }

  .horizontal {
    animation: 1s scaleX ease-in-out both;
    animation-delay: 0.4s;
  }
</style>
