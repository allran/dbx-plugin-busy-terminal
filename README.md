# Busy Terminal

Fake busy-terminal scenes inside a DBX workbench or an always-on-top floating widget. Entertainment only — not a real shell, SSH session, or job runner.

Inspired by the idea of [genact](https://github.com/svenstaro/genact), but implemented as a pure frontend DBX plugin (no Sidecar, no genact binary).

## Features

- Scene modules: `cargo`, `docker`, `sql`, `ansible`, `download`, `terraform`
- Settings drawer: scene, speed, play / pause, clear
- Command palette + app toolbar entry
- Optional desktop floating widget via `floating.open` (requires `host.workbench` + `capabilities.floating`)
- Remembers scene / speed with `host.storage` when available

## Permissions

| Permission | Why |
| --- | --- |
| `host.workbench` | Open floating desktop widget |
| `host.storage` | Persist scene / speed preferences |

No network, no Sidecar, no secrets.

## Develop

Requires Node.js 22+.

```bash
npm install
dbx-plugin dev --path . --port 5190
```

UI builds from `src/` into `ui/`. Use the real DBX desktop host to verify floating windows.

## Package

```bash
npm ci && npm run build
dbx-plugin package .
```

Produces an unsigned `universal` candidate under `dist/`.

## License

Apache-2.0
