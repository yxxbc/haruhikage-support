const REPO = "yxxbc/haruhikage-support";
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


// Theme: no data-theme follows the system; a click chooses one and keeps it.
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const storedTheme = localStorage.getItem("theme");
if (storedTheme === "light" || storedTheme === "dark") {
  root.dataset.theme = storedTheme;
}
themeToggle?.addEventListener("click", () => {
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const next = current === "light" ? "dark" : "light";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
});

// The hero's glow follows the pointer, at a distance.
const hero = document.querySelector(".hero");
hero?.addEventListener("pointermove", (event) => {
  const rect = hero.getBoundingClientRect();
  hero.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  hero.style.setProperty("--my", `${event.clientY - rect.top}px`);
});

// Sections fade in as they come into view.
const reveals = document.querySelectorAll(".reveal");
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => observer.observe(el));
}

// Screenshots open over the page.
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxClose = document.getElementById("lightbox-close");

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = button.dataset.lightbox || "";
    lightboxImage.alt = button.querySelector("img")?.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
});

// The last few releases, below the latest one.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadReleases() {
  const box = document.querySelector("[data-releases]");
  if (!box) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=5`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const releases = (await res.json()).filter((r) => !r.draft);
    if (!releases.length) return;
    box.innerHTML = releases.map((release, index) => `
      <a class="release-item" href="${escapeHtml(release.html_url)}" target="_blank" rel="noopener">
        <span><span class="version">${escapeHtml(release.tag_name)}</span>${index === 0 ? ' <span class="badge">最新</span>' : ""}</span>
        <span class="date">${escapeHtml(formatDate(release.published_at))}</span>
      </a>`).join("");
  } catch (err) {
    console.warn("releases:", err);
  }
}

loadReleases();
