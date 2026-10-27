<script>
  import { SCENE_IDS } from "../lib/scenes.js";

  /** @type {{
   *   open: boolean,
   *   text: Record<string, any>,
   *   sceneId: string,
   *   speed: number,
   *   running: boolean,
   *   canFloat: boolean,
   *   isWindow: boolean,
   *   floatError: string,
   *   onclose: () => void,
   *   onscenechange: () => void,
   *   onspeedchange: () => void,
   *   ontoggle: () => void,
   *   onclear: () => void,
   *   onopenfloat: () => void,
   * }} */
  let {
    open = false,
    text,
    sceneId = $bindable(""),
    speed = $bindable(1),
    running = false,
    canFloat = false,
    isWindow = false,
    floatError = "",
    onclose,
    onscenechange,
    onspeedchange,
    ontoggle,
    onclear,
    onopenfloat,
  } = $props();

  function onBackdropKey(event) {
    if (event.key === "Escape") onclose?.();
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

    <label class="field">
      <span>{text.speed} · {Number(speed).toFixed(1)}×</span>
      <input
        type="range"
        min="0.4"
        max="4"
        step="0.2"
        bind:value={speed}
        oninput={onspeedchange}
      />
    </label>

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
    background: rgba(2, 6, 14, 0.55);
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
    border-left: 1px solid rgba(34, 197, 94, 0.22);
    background: #0b1220;
    box-shadow: -18px 0 40px rgba(0, 0, 0, 0.35);
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
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
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
    color: #e5e7eb;
    background: transparent;
    font: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }
  .icon-btn:hover {
    background: rgba(148, 163, 184, 0.16);
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
    opacity: 0.65;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }
  .field > span {
    opacity: 0.72;
  }
  button,
  input[type="range"] {
    font: inherit;
  }
  input[type="range"] {
    width: 100%;
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
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
    padding: 9px 12px;
    color: #e5e7eb;
    background: rgba(15, 23, 42, 0.72);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .scene-item:hover {
    border-color: rgba(134, 239, 172, 0.35);
    background: rgba(22, 101, 52, 0.18);
  }
  .scene-item.active {
    border-color: rgba(134, 239, 172, 0.65);
    color: #ecfdf5;
    background: rgba(21, 128, 61, 0.35);
    box-shadow: inset 0 0 0 1px rgba(134, 239, 172, 0.2);
  }
  .scene-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(148, 163, 184, 0.45);
    flex-shrink: 0;
  }
  .scene-item.active .scene-dot {
    background: #86efac;
    box-shadow: 0 0 8px rgba(134, 239, 172, 0.7);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  button {
    border: 0;
    border-radius: 8px;
    padding: 9px 12px;
    color: #04110a;
    background: #86efac;
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
    color: #e5e7eb;
    background: rgba(148, 163, 184, 0.18);
  }
  button.accent {
    color: #ecfdf5;
    background: #15803d;
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
    opacity: 0.65;
  }
  .err {
    color: #fca5a5;
  }
</style>
