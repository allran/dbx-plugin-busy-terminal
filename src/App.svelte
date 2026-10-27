<script>
  import { onDestroy, onMount } from "svelte";
  import SettingsDrawer from "./components/SettingsDrawer.svelte";
  import { resolveMessages } from "./lib/i18n.js";
  import { SCENE_IDS, createScene } from "./lib/scenes.js";

  const STORAGE_KEY = "busy-terminal-prefs";
  const MAX_LINES = 400;
  const WORKBENCH_ID = "io.dbx.busy-terminal.workbench";

  let text = $state(resolveMessages("zh"));
  let surface = $state("tab");
  let sceneId = $state("sql");
  let speed = $state(1);
  let running = $state(true);
  let lines = $state(/** @type {string[]} */ ([]));
  let canFloat = $state(false);
  let floatError = $state("");
  let settingsOpen = $state(false);

  /** @type {ReturnType<typeof createScene> | null} */
  let scene = null;
  let timer = 0;
  let scrollEl = /** @type {HTMLPreElement | null} */ (null);
  let stageEl = /** @type {HTMLDivElement | null} */ (null);
  let scrollbarWidth = $state(0);
  let dragArmed = false;
  let dragging = false;
  let downX = 0;
  let downY = 0;
  /** @type {ResizeObserver | null} */
  let resizeObserver = null;

  const isWindow = $derived(surface === "window");

  onMount(() => {
    const boot = window.dbxPlugin?.ready?.then?.(async (ctx) => {
      const locale = window.dbxPlugin.locale || "en";
      text = resolveMessages(locale);
      surface = ctx?.surface || "tab";
      canFloat = Boolean(window.dbxPlugin.capabilities?.floating);

      await loadPrefs();
      restartScene(false);
      schedule();
      queueMicrotask(syncScrollbarWidth);
    });

    if (!boot) {
      text = resolveMessages(navigator.language);
      restartScene(false);
      schedule();
      queueMicrotask(syncScrollbarWidth);
    }

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => syncScrollbarWidth());
      if (scrollEl) resizeObserver.observe(scrollEl);
      if (stageEl) resizeObserver.observe(stageEl);
    }
    window.addEventListener("resize", syncScrollbarWidth);
  });

  onDestroy(() => {
    if (timer) clearTimeout(timer);
    resizeObserver?.disconnect();
    window.removeEventListener("resize", syncScrollbarWidth);
  });

  function syncScrollbarWidth() {
    if (!scrollEl) {
      scrollbarWidth = 0;
      return;
    }
    scrollbarWidth = Math.max(0, scrollEl.offsetWidth - scrollEl.clientWidth);
  }

  $effect(() => {
    lines;
    queueMicrotask(syncScrollbarWidth);
  });

  $effect(() => {
    if (!resizeObserver) return;
    if (scrollEl) resizeObserver.observe(scrollEl);
    if (stageEl) resizeObserver.observe(stageEl);
  });

  async function loadPrefs() {
    try {
      if (!window.dbxPlugin?.capabilities?.storage) return;
      const raw = await window.dbxPlugin.storage.get(STORAGE_KEY);
      if (!raw || typeof raw !== "object") return;
      if (SCENE_IDS.includes(raw.sceneId)) sceneId = raw.sceneId;
      const nextSpeed = Number(raw.speed);
      if (Number.isFinite(nextSpeed) && nextSpeed > 0) speed = nextSpeed;
      if (typeof raw.running === "boolean") running = raw.running;
    } catch {
      /* ignore */
    }
  }

  async function savePrefs() {
    try {
      if (!window.dbxPlugin?.capabilities?.storage) return;
      await window.dbxPlugin.storage.set(STORAGE_KEY, {
        sceneId,
        speed: Number(speed) || 1,
        running,
      });
    } catch {
      /* ignore */
    }
  }

  function restartScene(clear = true) {
    scene = createScene(sceneId);
    if (clear) lines = [];
    appendLine(`$ busy-terminal --scene ${sceneId} --speed ${speed}`);
  }

  function appendLine(line) {
    const next = line.split("\n");
    lines = [...lines, ...next].slice(-MAX_LINES);
    queueMicrotask(() => {
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    if (!running) return;
    const factor = Number(speed) || 1;
    const delay = Math.max(40, Math.round(280 / factor));
    timer = window.setTimeout(tick, delay);
  }

  function tick() {
    if (!running) return;
    if (!scene) scene = createScene(sceneId);
    let line = scene.next();
    if (line == null) {
      scene.reset();
      line = scene.next();
    }
    if (line != null) appendLine(line);
    schedule();
  }

  function onSceneChange() {
    restartScene(true);
    savePrefs();
  }

  function onSpeedChange() {
    savePrefs();
    schedule();
  }

  function toggleRun() {
    running = !running;
    savePrefs();
    if (running) schedule();
    else if (timer) clearTimeout(timer);
  }

  function clearLines() {
    lines = [];
    appendLine(`$ clear`);
  }

  async function openFloating() {
    floatError = "";
    if (!window.dbxPlugin?.capabilities?.floating) {
      floatError = text.floatUnavailable;
      return;
    }
    try {
      await savePrefs();
      await window.dbxPlugin.floating.open({
        contributionId: WORKBENCH_ID,
        title: text.title,
        width: 560,
        height: 340,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        context: { sceneId, speed: Number(speed) || 1 },
      });
      settingsOpen = false;
    } catch (err) {
      floatError = err?.message || String(err);
    }
  }

  async function closeFloating() {
    try {
      await window.dbxPlugin.floating.close(WORKBENCH_ID);
    } catch (err) {
      floatError = err?.message || String(err);
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape" && settingsOpen) settingsOpen = false;
  }

  function onGripDown(event) {
    if (!isWindow) return;
    if (event.target?.closest?.("button")) return;
    dragArmed = true;
    dragging = false;
    downX = event.clientX;
    downY = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  async function onGripMove(event) {
    if (!dragArmed || !isWindow) return;
    if (dragging) return;
    if (Math.hypot(event.clientX - downX, event.clientY - downY) < 4) return;
    dragging = true;
    try {
      await window.dbxPlugin.floating.beginDrag();
    } catch {
      /* ignore */
    }
  }

  async function onGripUp() {
    if (!isWindow) return;
    dragArmed = false;
    if (!dragging) return;
    dragging = false;
    try {
      await window.dbxPlugin.floating.endDrag({ snap: true });
    } catch {
      /* ignore */
    }
  }
</script>

<svelte:head><title>{text.title}</title></svelte:head>
<svelte:window onkeydown={onKeydown} />

<div class="root" class:window={isWindow}>
  {#if isWindow}
    <div
      class="grip"
      role="presentation"
      onpointerdown={onGripDown}
      onpointermove={onGripMove}
      onpointerup={onGripUp}
      onpointercancel={onGripUp}
    >
      <span class="dot"></span>
      <span class="grip-space"></span>
      <button
        type="button"
        class="icon-btn"
        onclick={() => (settingsOpen = true)}
        title={text.settings}
        aria-label={text.settings}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.6.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.77 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.89 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.39 1.03.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.6-.24 1.13-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
          />
        </svg>
      </button>
      <button type="button" class="icon-btn" onclick={closeFloating} title={text.closeFloat}>×</button>
    </div>
  {/if}

  <div class="stage" bind:this={stageEl}>
    {#if !isWindow}
      <button
        type="button"
        class="icon-btn settings-fab"
        style={`right: calc(10px + ${scrollbarWidth}px)`}
        onclick={() => (settingsOpen = true)}
        title={text.settings}
        aria-label={text.settings}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.6.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.77 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.89 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.39 1.03.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.6-.24 1.13-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
          />
        </svg>
      </button>
    {/if}
    <pre class="term" bind:this={scrollEl} aria-live="off">{lines.join("\n")}<span class="cursor">█</span></pre>
  </div>
</div>

<SettingsDrawer
  open={settingsOpen}
  {text}
  bind:sceneId
  bind:speed
  {running}
  {canFloat}
  {isWindow}
  {floatError}
  onclose={() => (settingsOpen = false)}
  onscenechange={onSceneChange}
  onspeedchange={onSpeedChange}
  ontoggle={toggleRun}
  onclear={clearLines}
  onopenfloat={openFloating}
/>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(html, body, #app) {
    margin: 0;
    height: 100%;
  }
  :global(body) {
    font-family: "IBM Plex Sans", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    color: #e5e7eb;
    background: #070b14;
  }

  .root {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100vh;
    background:
      radial-gradient(ellipse at top left, rgba(34, 197, 94, 0.12), transparent 42%),
      linear-gradient(180deg, #0b1220 0%, #070b14 100%);
  }
  .root.window {
    min-height: 100%;
    background: #05080f;
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    color: #e5e7eb;
    background: rgba(15, 23, 42, 0.72);
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-btn:hover {
    background: rgba(148, 163, 184, 0.28);
  }
  .settings-fab {
    position: absolute;
    top: 10px;
    z-index: 5;
    border: 1px solid rgba(34, 197, 94, 0.22);
    backdrop-filter: blur(8px);
  }

  .grip {
    display: flex;
    gap: 8px;
    align-items: center;
    height: 32px;
    padding: 0 8px 0 10px;
    border-bottom: 1px solid rgba(34, 197, 94, 0.2);
    cursor: grab;
    user-select: none;
    background: rgba(15, 23, 42, 0.85);
  }
  .grip:active {
    cursor: grabbing;
  }
  .grip .icon-btn {
    width: 28px;
    height: 28px;
    background: transparent;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.7);
  }
  .grip-space {
    flex: 1;
    min-height: 100%;
  }

  .term {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 14px 52px 20px 16px;
    overflow: auto;
    scrollbar-gutter: stable;
    font-family: "IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    color: #bbf7d0;
    background: rgba(2, 6, 14, 0.72);
  }
  .root.window .term {
    padding-right: 16px;
  }
  .cursor {
    display: inline-block;
    margin-left: 2px;
    animation: blink 1s step-end infinite;
    color: #4ade80;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
</style>
