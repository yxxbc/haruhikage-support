const REPO = "yxxbc/haruhikage-support";
const RELEASES = `https://github.com/${REPO}/releases`;
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

const assetNames = {
  "mac-arm": (v) => `haruhikage-app-${v}-arm64.dmg`,
  "mac-intel": (v) => `haruhikage-app-${v}-amd64.dmg`,
  "win-x64": (v) => `haruhikage-app-setup-${v}-amd64.exe`,
  "win-arm": (v) => `haruhikage-app-setup-${v}-arm64.exe`,
  "linux-deb-x64": (v) => `haruhikage-app_${v}_amd64.deb`,
  "linux-deb-arm": (v) => `haruhikage-app_${v}_arm64.deb`,
  "linux-tar-x64": (v) => `haruhikage-app-${v}-linux-amd64.tar.gz`,
  "linux-tar-arm": (v) => `haruhikage-app-${v}-linux-arm64.tar.gz`,
};

const platform = detectPlatform();

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "win";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "";
}

function markRecommended() {
  if (!platform) return;
  const card = document.querySelector(`.download-card[data-os="${platform}"]`);
  if (card) card.classList.add("recommended");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function applyRelease(release) {
  if (!release || !release.tag_name) return;
  const version = release.tag_name.replace(/^v/, "");
  document.querySelectorAll("[data-version]").forEach((el) => {
    el.textContent = `v${version}`;
  });
  const date = document.querySelector("[data-date]");
  if (date) date.textContent = formatDate(release.published_at);

  const assets = new Map((release.assets || []).map((a) => [a.name, a.browser_download_url]));
  document.querySelectorAll("[data-asset]").forEach((el) => {
    const make = assetNames[el.dataset.asset];
    if (!make) return;
    const url = assets.get(make(version));
    if (url) {
      el.href = url;
      el.removeAttribute("data-download");
      el.target = "_self";
    }
  });

  const primary = document.querySelector(".hero .button.primary");
  if (primary) primary.href = `${RELEASES}/tag/${release.tag_name}`;
}

async function loadLatest() {
  markRecommended();
  try {
    const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    applyRelease(await res.json());
  } catch (err) {
    // The release page always works, even when the API is rate limited.
    document.querySelectorAll("[data-version]").forEach((el) => {
      el.textContent = "最新版";
    });
    console.warn("latest release:", err);
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy || "";
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "已复制";
      setTimeout(() => (button.textContent = "复制"), 1400);
    } catch {
      button.textContent = "复制失败";
      setTimeout(() => (button.textContent = "复制"), 1400);
    }
  });
});

loadLatest();
