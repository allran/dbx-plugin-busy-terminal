const en = {
  title: "Busy Terminal",
  subtitle: "Fake activity only — nothing is running.",
  settings: "Settings",
  settingsTitle: "Settings",
  closeSettings: "Close",
  scene: "Scene",
  speed: "Speed",
  play: "Play",
  pause: "Pause",
  clear: "Clear",
  openFloat: "Open floating widget",
  closeFloat: "Close widget",
  floatUnavailable: "Floating windows need the desktop host.",
  tip: "Entertainment toy. Not a shell, SSH, or real job runner.",
  scenes: {
    cargo: "cargo build",
    docker: "docker build",
    sql: "SQL migrate",
    ansible: "ansible playbook",
    download: "download",
    terraform: "terraform apply",
  },
};

const zh = {
  title: "忙碌终端",
  subtitle: "纯假日志特效，什么都没在跑。",
  settings: "设置",
  settingsTitle: "设置",
  closeSettings: "关闭",
  scene: "场景",
  speed: "速度",
  play: "播放",
  pause: "暂停",
  clear: "清屏",
  openFloat: "打开浮动窗口",
  closeFloat: "关闭浮动窗",
  floatUnavailable: "浮动窗口仅桌面宿主可用。",
  tip: "娱乐玩具。不是真实终端、SSH 或任务执行器。",
  scenes: {
    cargo: "cargo 编译",
    docker: "docker 构建",
    sql: "SQL 迁移",
    ansible: "ansible 剧本",
    download: "下载进度",
    terraform: "terraform 应用",
  },
};

export function resolveMessages(locale) {
  return String(locale || "")
    .toLowerCase()
    .startsWith("zh")
    ? zh
    : en;
}
