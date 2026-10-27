/** @typedef {{ id: string, next: () => string | null, reset: () => void }} SceneRunner */

const CRATES = [
  "serde",
  "tokio",
  "anyhow",
  "thiserror",
  "clap",
  "tracing",
  "reqwest",
  "sqlx",
  "axum",
  "chrono",
  "uuid",
  "rand",
];

const PACKAGES = [
  "libc6-dev",
  "libssl-dev",
  "zlib1g-dev",
  "cmake",
  "ninja-build",
  "pkg-config",
];

const TABLES = [
  "users",
  "sessions",
  "audit_log",
  "connections",
  "query_history",
  "plugin_settings",
];

const HOSTS = ["db-01", "db-02", "cache-a", "worker-7", "bastion"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function hex(n = 8) {
  let out = "";
  for (let i = 0; i < n; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function pct(step, total) {
  return Math.min(100, Math.round((step / total) * 100));
}

function bar(p) {
  const filled = Math.round(p / 5);
  return `[${"#".repeat(filled)}${".".repeat(20 - filled)}] ${String(p).padStart(3, " ")}%`;
}

/** @returns {SceneRunner} */
function cargoScene() {
  let i = 0;
  const total = 18 + Math.floor(Math.random() * 10);
  return {
    id: "cargo",
    reset() {
      i = 0;
    },
    next() {
      i += 1;
      if (i === 1) return "   Compiling busy-terminal v0.1.0";
      if (i < total - 2) {
        const crate = pick(CRATES);
        const ver = `1.${Math.floor(Math.random() * 80)}.${Math.floor(Math.random() * 20)}`;
        return `   Compiling ${crate} v${ver}`;
      }
      if (i === total - 1) return "    Finished `release` profile [optimized] target(s) in 42.07s";
      if (i === total) return "     Running `target/release/busy-terminal`";
      i = 0;
      return null;
    },
  };
}

/** @returns {SceneRunner} */
function dockerScene() {
  let i = 0;
  const layers = 8 + Math.floor(Math.random() * 6);
  return {
    id: "docker",
    reset() {
      i = 0;
    },
    next() {
      i += 1;
      if (i === 1) return `Sending build context to Docker daemon  ${Math.floor(Math.random() * 40) + 12}. ${Math.floor(Math.random() * 9)}MB`;
      if (i === 2) return `Step 1/${layers} : FROM debian:bookworm-slim`;
      if (i <= layers) {
        const step = i;
        if (step === 3) return `Step ${step}/${layers} : RUN apt-get update && apt-get install -y ${pick(PACKAGES)}`;
        if (step === 4) return `Step ${step}/${layers} : COPY . /app`;
        if (step === 5) return `Step ${step}/${layers} : WORKDIR /app`;
        if (step === layers) return `Step ${step}/${layers} : CMD ["./busy-terminal"]`;
        return `Step ${step}/${layers} : RUN echo layer-${hex(4)} && true`;
      }
      if (i === layers + 1) return `Successfully built ${hex(12)}`;
      if (i === layers + 2) return `Successfully tagged busy-terminal:dev`;
      i = 0;
      return null;
    },
  };
}

/** @returns {SceneRunner} */
function sqlScene() {
  let i = 0;
  const steps = 12 + Math.floor(Math.random() * 8);
  return {
    id: "sql",
    reset() {
      i = 0;
    },
    next() {
      i += 1;
      if (i === 1) return "dbx migrate: connecting via plugin tunnel…";
      if (i === 2) return `dbx migrate: acquired advisory lock ${hex(6)}`;
      if (i < steps - 1) {
        const table = pick(TABLES);
        const n = Math.floor(Math.random() * 4000) + 120;
        const actions = [
          `APPLY  2026${hex(4)}_add_index_on_${table} (${n} rows)`,
          `APPLY  2026${hex(4)}_alter_${table}_add_column`,
          `CHECK  ${table} · ok · ${n}ms`,
          `VACUUM ANALYZE ${table}`,
        ];
        return pick(actions);
      }
      if (i === steps - 1) return "dbx migrate: releasing lock";
      if (i === steps) return `dbx migrate: done · ${steps - 3} changes · ${((Math.random() * 4) + 1).toFixed(2)}s`;
      i = 0;
      return null;
    },
  };
}

/** @returns {SceneRunner} */
function ansibleScene() {
  let i = 0;
  const tasks = 10 + Math.floor(Math.random() * 8);
  return {
    id: "ansible",
    reset() {
      i = 0;
    },
    next() {
      i += 1;
      if (i === 1) return "PLAY [rolling restart] ********************************************************";
      if (i <= tasks) {
        const host = pick(HOSTS);
        const task = pick([
          "Gathering Facts",
          "Ensure packages present",
          "Render config template",
          "Reload service",
          "Wait for healthcheck",
        ]);
        const status = Math.random() > 0.15 ? "ok" : "changed";
        return `${status}: [${host}] => (${task})`;
      }
      if (i === tasks + 1) {
        return `PLAY RECAP *********************************************************************\n${pick(HOSTS)} : ok=${tasks - 1}  changed=${Math.floor(tasks / 4)}  unreachable=0  failed=0`;
      }
      i = 0;
      return null;
    },
  };
}

/** @returns {SceneRunner} */
function downloadScene() {
  let i = 0;
  const total = 24;
  let name = `dataset-${hex(4)}.parquet`;
  let sizeMb = 80 + Math.floor(Math.random() * 220);
  return {
    id: "download",
    reset() {
      i = 0;
      name = `dataset-${hex(4)}.parquet`;
      sizeMb = 80 + Math.floor(Math.random() * 220);
    },
    next() {
      i += 1;
      if (i === 1) return `GET https://cdn.example/artifacts/${name}`;
      if (i < total) {
        const p = pct(i, total);
        const done = ((sizeMb * p) / 100).toFixed(1);
        return `${bar(p)}  ${done}/${sizeMb} MB  ${Math.floor(Math.random() * 18) + 4}.${Math.floor(Math.random() * 9)} MB/s`;
      }
      if (i === total) return `saved ${name}  sha256:${hex(16)}…`;
      i = 0;
      return null;
    },
  };
}

/** @returns {SceneRunner} */
function terraformScene() {
  let i = 0;
  const n = 14 + Math.floor(Math.random() * 6);
  return {
    id: "terraform",
    reset() {
      i = 0;
    },
    next() {
      i += 1;
      if (i === 1) return "Terraform will perform the following actions:";
      if (i < n - 2) {
        const res = pick([
          "aws_db_instance.primary",
          "aws_security_group.db",
          "null_resource.seed",
          "random_password.master",
          "aws_cloudwatch_log_group.app",
        ]);
        const op = pick(["will be created", "will be updated in-place", "must be replaced"]);
        return `  # ${res} ${op}`;
      }
      if (i === n - 1) return `Plan: ${Math.floor(n / 3)} to add, ${Math.floor(n / 5)} to change, 0 to destroy.`;
      if (i === n) return "Apply complete! Resources: ok.";
      i = 0;
      return null;
    },
  };
}

export const SCENE_IDS = ["cargo", "docker", "sql", "ansible", "download", "terraform"];

/** @param {string} id */
export function createScene(id) {
  switch (id) {
    case "docker":
      return dockerScene();
    case "sql":
      return sqlScene();
    case "ansible":
      return ansibleScene();
    case "download":
      return downloadScene();
    case "terraform":
      return terraformScene();
    case "cargo":
    default:
      return cargoScene();
  }
}
