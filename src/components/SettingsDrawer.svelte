<script>
  import { SCENE_IDS } from "../lib/scenes.js";
  import { SPEED_MAX, SPEED_MIN } from "../lib/speed.js";

  /** @type {{
   *   open: boolean,
   *   text: Record<string, any>,
   *   sceneId: string,
   *   speed: number,
   *   speedRandom: boolean,
   *   running: boolean,
   *   canFloat: boolean,
   *   isWindow: boolean,
   *   floatError: string,
   *   onclose: () => void,
   *   onscenechange: () => void,
   *   onspeedchange: () => void,
   *   onspeedmodechange: () => void,
   *   ontoggle: () => void,
   *   onclear: () => void,
   *   onopenfloat: () => void,
   * }} */
  let {
    open = false,
    text,
    sceneId = $bindable(""),
    speed = $bindable(1),
    speedRandom = $bindable(false),
    running = false,
    canFloat = false,
    isWindow = false,
    floatError = "",
    onclose,
    onscenechange,
    onspeedchange,
    onspeedmodechange,
    ontoggle,
    onclear,
    onopenfloat,
  } = $props();

  function onBackdropKey(event) {
    if (event.key === "Escape") onclose?.();
  }

  function setSpeedRandom(next) {
    if (speedRandom === next) return;
    speedRandom = next;
    onspeedmodechange?.();
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={onclose}
    onkeydown={onBackdropKey}
  ></div>
{/if}

<aside class="drawer" class:open aria-hidden={!open}>
  <header class="drawer-head">
    <h2>{text.settingsTitle}</h2>
    <button type="button" class="icon-btn" onclick={onclose} title={text.closeSettings} aria-label={text.closeSettings}>
      ×
    </button>
  </header>

  <div class="drawer-body">
    <div class="brand">
      <h3>{text.title}</h3>
      <p>{text.subtitle}</p>
    </div>

    <div class="field">
      <span>{text.scene}</span>
      <div class="scene-list" role="listbox" aria-label={text.scene}>
        {#each SCENE_IDS as id}
          <button
            type="button"
            class="scene-item"
            class:active={sceneId === id}
            role="option"
            aria-selected={sceneId === id}
            onclick={() => {
              if (sceneId === id) return;
              sceneId = id;
              onscenechange?.();
            }}
          >
            <span class="scene-dot" aria-hidden="true"></span>
            <span>{text.scenes[id] || id}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="field">
      <span id="speed-label">{text.speed} · {speedRandom ? text.speedRandom : `${Number(speed).toFixed(1)}×`}</span>
      <div class="speed-mode" role="group" aria-label={text.speedMode}>
        <button
          type="button"
          class:active={!speedRandom}
          aria-pressed={!speedRandom}
          onclick={() => setSpeedRandom(false)}
        >
          {text.speedFixed}
        </button>
        <button
          type="button"
          class:active={speedRandom}
          aria-pressed={speedRandom}
          onclick={() => setSpeedRandom(true)}
        >
          {text.speedRandom}
        </button>
      </div>
      {#if speedRandom}
        <p class="field-hint">{text.speedRandomHint}</p>
      {:else}
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step="0.2"
          aria-labelledby="speed-label"
          bind:value={speed}
          oninput={onspeedchange}
        />
      {/if}
    </div>

    <div class="actions">
      <button type="button" class="with-icon" onclick={ontoggle}>
        {#if running}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7 5h3v14H7V5zm7 0h3v14h-3V5z" />
          </svg>
          <span>{text.pause}</span>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
          </svg>
          <span>{text.play}</span>
        {/if}
      </button>
      <button type="button" class="ghost with-icon" onclick={onclear}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 7h12v2H6V7zm2 3h2v8H8v-8zm6 0h2v8h-2v-8zm-3-7h2l1 1h5v2H5V4h5l1-1z"
          />
        </svg>
        <span>{text.clear}</span>
      </button>
    </div>

    {#if canFloat && !isWindow}
      <button type="button" class="accent full with-icon" onclick={onopenfloat}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4h9v2H6v5H4V4zm7 7h9v9h-9v-9zm2 2v5h5v-5h-5zM14 4h6v6h-2V6h-4V4zM4 14h6v2H6v4H4v-6z"
          />
        </svg>
        <span>{text.openFloat}</span>
      </button>
    {/if}

    <p class="tip">{text.tip}</p>
    {#if floatError}<p class="err">{floatError}</p>{/if}
  </div>
</aside>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: color-mix(in srgb, var(--bt-bg, #070b14) 45%, transparent);
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    width: min(320px, 92vw);
    height: 100%;
    border-left: 1px solid var(--bt-accent-border, rgba(34, 197, 94, 0.22));
    background: var(--bt-panel, #0b1220);
    color: var(--bt-fg, #e5e7eb);
    box-shadow: -18px 0 40px color-mix(in srgb, #000 35%, transparent);
    transform: translateX(100%);
    transition: transform 180ms ease;
    pointer-events: none;
    visibility: hidden;
  }
  .drawer.open {
    transform: translateX(0);
    pointer-events: auto;
    visibility: visible;
  }

  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 14px 12px;
    border-bottom: 1px solid var(--bt-border, rgba(148, 163, 184, 0.16));
  }
  .drawer-head h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 650;
  }
  .icon-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    color: var(--bt-fg, #e5e7eb);
    background: transparent;
    font: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }
  .icon-btn:hover {
    background: var(--bt-hover, rgba(148, 163, 184, 0.16));
  }

  .drawer-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 14px 24px;
    overflow: auto;
  }

  .brand h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  .brand p {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--bt-muted, inherit);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }
  .field > span {
    color: var(--bt-muted, inherit);
  }
  button,
  input[type="range"] {
    font: inherit;
  }
  input[type="range"] {
    width: 100%;
    accent-color: var(--bt-accent, #22c55e);
  }

  .speed-mode {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .speed-mode button {
    border: 1px solid var(--bt-border, rgba(148, 163, 184, 0.22));
    border-radius: var(--bt-radius, 8px);
    padding: 7px 10px;
    color: var(--bt-fg, #e5e7eb);
    background: var(--bt-panel-strong, rgba(15, 23, 42, 0.72));
    font-size: 12px;
  }
  .speed-mode button:hover {
    border-color: var(--bt-accent-border, rgba(134, 239, 172, 0.35));
    background: var(--bt-accent-soft, rgba(22, 101, 52, 0.18));
  }
  .speed-mode button.active {
    border-color: var(--bt-accent, #86efac);
    color: var(--bt-fg, #ecfdf5);
    background: var(--bt-accent-soft, rgba(21, 128, 61, 0.35));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bt-accent, #86efac) 25%, transparent);
  }
  .field-hint {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--bt-muted, inherit);
  }

  .scene-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .scene-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: 1px solid var(--bt-border, rgba(148, 163, 184, 0.22));
    border-radius: var(--bt-radius, 8px);
    padding: 9px 12px;
    color: var(--bt-fg, #e5e7eb);
    background: var(--bt-panel-strong, rgba(15, 23, 42, 0.72));
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .scene-item:hover {
    border-color: var(--bt-accent-border, rgba(134, 239, 172, 0.35));
    background: var(--bt-accent-soft, rgba(22, 101, 52, 0.18));
  }
  .scene-item.active {
    border-color: var(--bt-accent, #86efac);
    color: var(--bt-fg, #ecfdf5);
    background: var(--bt-accent-soft, rgba(21, 128, 61, 0.35));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bt-accent, #86efac) 25%, transparent);
  }
  .scene-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--bt-fg, #94a3b8) 45%, transparent);
    flex-shrink: 0;
  }
  .scene-item.active .scene-dot {
    background: var(--bt-accent, #86efac);
    box-shadow: 0 0 8px color-mix(in srgb, var(--bt-accent, #86efac) 70%, transparent);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  button {
    border: 0;
    border-radius: var(--bt-radius, 8px);
    padding: 9px 12px;
    color: var(--bt-accent-fg, #04110a);
    background: var(--bt-accent, #86efac);
    font-size: 13px;
    line-height: 1.2;
    cursor: pointer;
  }
  button.with-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }
  button.with-icon svg {
    width: 1.15em;
    height: 1.15em;
    flex-shrink: 0;
  }
  button.with-icon span {
    line-height: 1;
  }
  button.ghost {
    color: var(--bt-fg, #e5e7eb);
    background: var(--bt-hover, rgba(148, 163, 184, 0.18));
  }
  button.accent {
    color: var(--bt-accent-fg, #ecfdf5);
    background: color-mix(in srgb, var(--bt-accent, #15803d) 78%, #000);
  }
  button.full {
    width: 100%;
  }

  .tip,
  .err {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
  }
  .tip {
    color: var(--bt-muted, inherit);
  }
  .err {
    color: var(--bt-danger, #fca5a5);
  }
</style>
