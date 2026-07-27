
let liveCountdownTimer=null;
function youtubeIdFromUrl(url){const m=String(url||"").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([^?&/]+)/i);return m?.[1]||"";}
function twitchChannelFromUrl(url){try{return new URL(url).pathname.split("/").filter(Boolean)[0]||"";}catch{return "";}}
function safeLiveUrl(url){try{const p=new URL(url,location.href);return ["http:","https:"].includes(p.protocol)?p.href:"";}catch{return "";}}
function makeLiveEmbed(d){const custom=safeLiveUrl(d.live_embed_url);if(custom)return custom;const url=safeLiveUrl(d.live_stream_url);if(!url)return "";const p=d.live_platform||"youtube";if(p==="youtube"){const id=youtubeIdFromUrl(url);return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`:"";}if(p==="twitch"){const c=twitchChannelFromUrl(url);return c?`https://player.twitch.tv/?channel=${encodeURIComponent(c)}&parent=${encodeURIComponent(location.hostname)}`:"";}if(p==="facebook")return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;if(p==="kick"){try{const c=new URL(url).pathname.split("/").filter(Boolean)[0];return c?`https://player.kick.com/${encodeURIComponent(c)}`:"";}catch{return "";}}return "";}
function setLiveCountdown(startAt,enabled){if(liveCountdownTimer)clearInterval(liveCountdownTimer);const box=document.getElementById("liveCountdown");if(!box)return;const target=new Date(startAt||"").getTime();if(!enabled||!Number.isFinite(target)||target<=Date.now()){box.hidden=true;return;}box.hidden=false;const update=()=>{const r=Math.max(0,target-Date.now());countdownDays.textContent=String(Math.floor(r/86400000)).padStart(2,"0");countdownHours.textContent=String(Math.floor((r%86400000)/3600000)).padStart(2,"0");countdownMinutes.textContent=String(Math.floor((r%3600000)/60000)).padStart(2,"0");countdownSeconds.textContent=String(Math.floor((r%60000)/1000)).padStart(2,"0");if(r<=0){clearInterval(liveCountdownTimer);box.hidden=true;}};update();liveCountdownTimer=setInterval(update,1000);}
function renderLiveCenter(d){const shell=document.getElementById("liveCenterShell");if(!shell)return;const s=d.live_status||"offline",isLive=s==="live",isSoon=s==="coming_soon",statusText=isLive?"LIVE NOW":isSoon?"COMING SOON":"OFFLINE",title=d.live_stream_title||"DOSMOS Live",offline=d.live_offline_text||"Live berikutnya segera hadir.",watch=safeLiveUrl(d.live_watch_url||d.live_stream_url),embed=makeLiveEmbed(d),thumb=safeLiveUrl(d.live_thumbnail_url);[liveStatusPill,liveStatusSide].forEach(el=>{if(el){el.textContent=statusText;el.className=`live-status-pill ${isLive?"is-live":isSoon?"is-coming":"is-offline"}`;}});livePlatformLabel.textContent=(d.live_platform||"youtube").toUpperCase();liveStreamTitle.textContent=title;liveStreamDescription.textContent=d.live_description||"Saksikan siaran langsung dan pertandingan terbaru dari DOSMOS.";liveChannelName.textContent=d.live_channel_name||"DOSMOS Official";liveViewerText.textContent=d.live_viewer_text||"";liveWatchButton.textContent=d.live_button_text||"WATCH NOW";liveWatchButton.hidden=!watch;if(watch)liveWatchButton.href=watch;const frame=document.getElementById("liveFrame");if(isLive&&embed){frame.innerHTML=`<iframe src="${embed.replace(/"/g,"&quot;")}" title="${title.replace(/"/g,"&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;}else{frame.innerHTML=`<div class="live-placeholder" ${thumb?`style="background-image:linear-gradient(rgba(5,5,5,.58),rgba(5,5,5,.88)),url('${thumb.replace(/'/g,"%27")}')"`:""}><div class="live-status-pill ${isSoon?"is-coming":"is-offline"}" id="liveStatusPill">${statusText}</div><h3 id="livePlaceholderTitle">${title}</h3><p id="livePlaceholderText">${offline}</p><div class="live-countdown" id="liveCountdown" hidden><div><strong id="countdownDays">00</strong><span>Hari</span></div><div><strong id="countdownHours">00</strong><span>Jam</span></div><div><strong id="countdownMinutes">00</strong><span>Menit</span></div><div><strong id="countdownSeconds">00</strong><span>Detik</span></div></div></div>`;}setLiveCountdown(d.live_start_at,String(d.live_show_countdown)!=="false"&&!isLive);}



function applyPublicContent(data){
  document.querySelectorAll("[data-content]").forEach(el=>{
    const key=el.dataset.content;
    const value=data?.[key];
    if(value)el.textContent=value;
  });
  document.querySelectorAll("[data-content-href]").forEach(el=>{
    const key=el.dataset.contentHref;
    const value=data?.[key];
    if(value)el.setAttribute("href",value);
  });
}



function validBrandHex(value){
  return /^#[0-9a-fA-F]{6}$/.test(String(value||"").trim());
}

function applyPublicBranding(data){
  const siteName=data.site_name||"DOSMOS";
  const slogan=data.slogan||"Every Gamer Deserves a Chance.";
  const mainLogo=data.main_logo_url||"dosmos-logo.png";
  const heroLogo=data.hero_logo_url||mainLogo;
  const favicon=data.favicon_url||mainLogo;
  const heroBackground=data.hero_background_url||"";
  const mobileHeroBackground=data.mobile_hero_background_url||heroBackground;
  const footerBackground=data.footer_background_url||"";
  const heroOverlay=Math.min(95,Math.max(0,Number(data.hero_overlay||65)));
  const heroPosition=data.hero_position||"center";

  document.querySelectorAll("[data-site-name]").forEach(el=>el.textContent=siteName);
  document.querySelectorAll("[data-site-slogan]").forEach(el=>el.textContent=slogan);
  document.querySelectorAll(".site-main-logo").forEach(img=>img.src=mainLogo);
  document.querySelectorAll(".site-hero-logo").forEach(img=>img.src=heroLogo);

  const fav=document.getElementById("siteFavicon");
  if(fav)fav.href=favicon;

  document.title=`${siteName} | Gaming & Esports Company`;
  const meta=document.getElementById("siteMetaDescription");
  if(meta)meta.content=`${siteName} Gaming & Esports Company — ${slogan}`;

  if(validBrandHex(data.primary_color)){
    document.documentElement.style.setProperty("--brand-primary",data.primary_color);
    document.documentElement.style.setProperty("--gold",data.primary_color);
  }
  if(validBrandHex(data.background_color)){
    document.documentElement.style.setProperty("--brand-background",data.background_color);
    document.documentElement.style.setProperty("--bg",data.background_color);
  }

  document.documentElement.style.setProperty("--hero-bg-image",heroBackground?`url("${heroBackground}")`:"none");
  document.documentElement.style.setProperty("--hero-mobile-bg-image",mobileHeroBackground?`url("${mobileHeroBackground}")`:"var(--hero-bg-image)");
  document.documentElement.style.setProperty("--hero-overlay",(heroOverlay/100).toFixed(2));
  document.documentElement.style.setProperty("--hero-position",heroPosition);
  document.documentElement.style.setProperty("--footer-bg-image",footerBackground?`url("${footerBackground}")`:"none");
}


const cfg = window.DOSMOS_CONFIG;
const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);

const esc = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmtDate = v => !v ? "Segera diumumkan" : new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(v+"T00:00:00"));
const statusText = v => {
  const s=String(v||"upcoming").toLowerCase();
  if(["active","ongoing","open"].includes(s)) return "Sedang Berjalan";
  if(["finished","done","completed"].includes(s)) return "Selesai";
  return "Akan Datang";
};
async function getRows(table,orderCol="created_at",ascending=false){
  const {data,error}=await sb.from(table).select("*").order(orderCol,{ascending});
  if(error)throw error;return data||[];
}
function cards(rows,type){
  if(!rows.length)return '<div class="empty">Belum ada data.</div>';
  if(type==="events")return rows.map(e=>{
    const bg=e.banner?`linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(e.banner)}")`:"";
    return `<article class="card"><div class="cover" ${bg?`style='background:${bg} center/cover'`:""}>
      <div><span class="status">${esc(statusText(e.status))}</span><h3>${esc(e.title)}</h3></div></div>
      <div class="card-body"><p class="lead">${esc(e.description||"Detail event segera diumumkan.")}</p>
      <div class="meta-grid"><div class="meta"><small>Mulai</small><strong>${esc(fmtDate(e.start_date))}</strong></div>
      <div class="meta"><small>Selesai</small><strong>${esc(fmtDate(e.end_date))}</strong></div>
      <div class="meta"><small>Prize Pool</small><strong>${esc(e.prize_pool||"Segera diumumkan")}</strong></div></div>
      <div class="actions" style="justify-content:flex-start"><a class="btn btn-primary" target="_blank" rel="noopener" href="${esc(e.registration_link||"#register")}">Daftar</a><a class="btn btn-secondary" href="#bracket">Bracket</a></div>
      </div></article>`;
  }).join("");
  if(type==="champions")return rows.map(c=>`<article class="card"><div class="cover" ${c.photo?`style='background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(c.photo)}") center/cover'`:""}>
    <div><span class="status">${esc(c.rank||"Champion")}</span><h3>${esc(c.team_name)}</h3></div></div>
    <div class="card-body"><p class="lead">${esc(c.story||"Perjalanan sang juara akan ditampilkan di sini.")}</p>
    <div class="meta-grid"><div class="meta"><small>Event</small><strong>${esc(c.event_name||"-")}</strong></div>
    <div class="meta"><small>MVP</small><strong>${esc(c.mvp||"-")}</strong></div>
    <div class="meta"><small>Hadiah</small><strong>${esc(c.prize||"-")}</strong></div></div></div></article>`).join("");
  if(type==="news")return rows.map(n=>`<article class="card"><div class="cover" ${n.cover?`style='background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(n.cover)}") center/cover'`:""}><h3>${esc(n.title)}</h3></div><div class="card-body"><p class="lead">${esc(n.summary||n.content||"")}</p></div></article>`).join("");
  return rows.map(g=>`<article class="card"><div class="cover" style='background:linear-gradient(to top,rgba(5,5,5,.9),rgba(5,5,5,.05)),url("${esc(g.image_url)}") center/cover'><h3>${esc(g.caption||"DOSMOS Moment")}</h3></div></article>`).join("");
}
async function loadContent(){
  const items=[
    ["eventGrid","events","start_date",true,"events"],
    ["championGrid","champions","created_at",false,"champions"],
    ["newsGrid","news","published_at",false,"news"],
    ["galleryGrid","gallery","created_at",false,"gallery"]
  ];
  for(const [id,table,order,asc,type] of items){
    try{document.getElementById(id).innerHTML=cards(await getRows(table,order,asc),type)}
    catch(e){document.getElementById(id).innerHTML=`<div class="empty">${type} gagal dimuat.</div>`}
  }
}
async function loadSponsors(){
  const el=document.getElementById("sponsorGrid");
  try{
    const rows=await getRows("sponsors","sort_order",true);
    el.innerHTML=rows.length?rows.map(s=>`<a class="sponsor-card" href="${esc(s.website||"#")}" target="_blank" rel="noopener">${s.logo?`<img src="${esc(s.logo)}" alt="${esc(s.name)}">`:`<strong>${esc(s.name)}</strong>`}</a>`).join(""):'<div class="empty">Partnership terbuka.</div>';
  }catch(e){el.innerHTML='<div class="empty">Sponsor gagal dimuat.</div>'}
}
async function loadBracket(){
  const el=document.getElementById("bracketWrap");
  try{
    const rows=await getRows("matches","sort_order",true);
    if(!rows.length){el.innerHTML='<div class="empty">Bracket belum dipublikasikan.</div>';return}
    const groups={};
    rows.forEach(m=>(groups[m.round_name||"Round"]??=[]).push(m));
    el.innerHTML=Object.entries(groups).map(([round,matches])=>`<div class="round"><h3>${esc(round)}</h3>${matches.map(m=>`<div class="match"><strong>${esc(m.team_a||"TBD")} ${m.score_a??""}</strong><span>VS</span><strong>${m.score_b??""} ${esc(m.team_b||"TBD")}</strong></div>`).join("")}</div>`).join("");
  }catch(e){el.innerHTML='<div class="empty">Bracket gagal dimuat.</div>'}
}
async function loadSettings(){
  try{
    const {data}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(!data)return;
    applyPublicBranding(data);
    applyPublicContent(data);
    renderLiveCenter(data);
    document.querySelectorAll("[data-wa]").forEach(a=>a.href=`https://wa.me/${String(data.whatsapp||"6281288836205").replace(/\D/g,"")}`);
    document.querySelectorAll("[data-email]").forEach(a=>{a.href=`mailto:${data.email||"dosmosid@gmail.com"}`;a.querySelector("strong")&&(a.querySelector("strong").textContent=data.email||"dosmosid@gmail.com")});
    document.querySelectorAll("[data-instagram]").forEach(a=>a.href=data.instagram||"https://instagram.com/dosmos.id");
    document.querySelectorAll("[data-tiktok]").forEach(a=>a.href=data.tiktok||"#");
    document.querySelectorAll("[data-discord]").forEach(a=>a.href=data.discord||"#");
    " allowfullscreen></iframe>`;
    }
  }catch(e){}
}
function extractYoutubeId(url=""){
  const m=String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([^?&/]+)/);
  return m?m[1]:"";
}
document.getElementById("registrationForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("registrationMessage");
  const payload={
    event_name:document.getElementById("reg_event").value.trim(),
    team_name:document.getElementById("reg_team").value.trim(),
    captain_name:document.getElementById("reg_captain").value.trim(),
    whatsapp:document.getElementById("reg_whatsapp").value.trim(),
    roster:document.getElementById("reg_roster").value.trim(),
    notes:document.getElementById("reg_notes").value.trim(),
    status:"pending"
  };
  const {error}=await sb.from("registrations").insert(payload);
  if(error){out.textContent=error.message;out.className="message error";return}
  out.textContent="Pendaftaran berhasil dikirim. Panitia akan menghubungi kamu.";out.className="message success";e.target.reset();
});
document.querySelectorAll(".logo").forEach(img=>{
  img.addEventListener("error",()=>{img.style.display="none";const fb=img.nextElementSibling;if(fb)fb.style.display="grid"});
  img.addEventListener("load",()=>{const fb=img.nextElementSibling;if(fb)fb.style.display="none"});
});
document.getElementById("menuBtn")?.addEventListener("click",()=>document.getElementById("navLinks").classList.toggle("open"));
loadContent();loadSponsors();loadBracket();loadSettings();
