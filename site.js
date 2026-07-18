const DATA = window.ZERO_HOUR_SITE_DATA || {gallery:[],videos:[],updates:[]};
const galleryGrid = document.getElementById("galleryGrid");
const videosGrid = document.getElementById("videosGrid");
const updatesGrid = document.getElementById("updatesGrid");

(DATA.gallery || []).forEach(item => {
  const figure = document.createElement("figure");
  figure.className = "gallery-card";
  const img = document.createElement("img");
  img.src = item.image;
  img.alt = item.caption || "Zero Hour RP screenshot";
  img.loading = "lazy";
  img.onerror = () => figure.remove();
  const caption = document.createElement("figcaption");
  caption.textContent = item.caption || "Zero Hour RP";
  figure.append(img, caption);
  galleryGrid.append(figure);
});
document.getElementById("galleryEmpty").style.display = galleryGrid.children.length ? "none" : "block";

(DATA.videos || []).forEach(item => {
  const card = document.createElement("article");
  card.className = "video-card";
  if (item.type === "youtube" && item.embed) {
    const iframe = document.createElement("iframe");
    iframe.src = item.embed;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    card.append(iframe);
  } else if (item.src) {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    const source = document.createElement("source");
    source.src = item.src;
    source.type = item.mimeType || "video/mp4";
    video.append(source);
    card.append(video);
  }
  const info = document.createElement("div");
  info.className = "video-info";
  info.innerHTML = `<h3>${escapeHtml(item.title || "Zero Hour RP Video")}</h3><p>${escapeHtml(item.description || "")}</p>`;
  card.append(info);
  videosGrid.append(card);
});
document.getElementById("videosEmpty").style.display = videosGrid.children.length ? "none" : "block";

(DATA.updates || []).forEach(item => {
  const card = document.createElement("article");
  card.className = "update-card";
  card.innerHTML = `<small>${escapeHtml(item.tag || "UPDATE")}</small><h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.body || "")}</p>`;
  updatesGrid.append(card);
});

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(btn.dataset.tab + "Panel").classList.add("active");
}));
document.querySelector(".nav-toggle").addEventListener("click", () => document.querySelector(".topbar nav").classList.toggle("open"));

const cfg = window.ZERO_HOUR_CONFIG || {};
if (cfg.cfxJoinCode) {
  const url = `https://cfx.re/join/${cfg.cfxJoinCode}`;
  ["connectButton","joinServerTop","joinServerBottom"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.href = url; el.target = "_blank"; }
  });
  document.getElementById("connectButton").textContent = "Connect to Server";
  document.getElementById("configNote").textContent = "Direct FiveM connection is ready.";
}
function escapeHtml(value){const d=document.createElement("div");d.textContent=String(value);return d.innerHTML;}