

/* DOSMOS VIP V14.4 — ANNOUNCEMENT FRONTEND */
function annEscape(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function annSafeUrl(value){
  if(!value)return "";
  if(String(value).startsWith("#"))return String(value);
  try{
    const url=new URL(value,location.href);
    return ["http:","https:"].includes(url.protocol)?url.href:"";
  }catch{return "";}
}
function isAnnouncementActive(item){
  if(item.status!=="published")return false;
  const now=Date.now();
  if(item.start_at&&new Date(item.start_at).getTime()>now)return false;
  if(item.end_at&&new Date(item.end_at).getTime()<now)return false;
  return true;
}
function announcementDismissKey(item){return `dosmos-ann-dismissed-${item.id}`;}
function isAnnouncementDismissed(item){return sessionStorage.getItem(announcementDismissKey(item))==="1";}
function dismissAnnouncement(item,el){
  sessionStorage.setItem(announcementDismissKey(item),"1");
  el?.remove();
}
function announcementButton(item){
  const url=annSafeUrl(item.button_url);
  if(!item.button_text||!url)return "";
  return `<a class="ann-btn" href="${annEscape(url)}" ${url.startsWith("#")?"":'target="_blank" rel="noopener"'}>${annEscape(item.button_text)}</a>`;
}
function announcementClose(item){
  return item.dismissible!==false?`<button class="ann-close" type="button" aria-label="Tutup">×</button>`:"";
}
function announcementBaseClass(item){
  return `dosmos-ann theme-${item.theme||"gold"} anim-${item.animation||"fade"} ${item.emergency?"is-emergency":""}`;
}
function bindAnnouncementElement(item,el){
  el.querySelector(".ann-close")?.addEventListener("click",()=>dismissAnnouncement(item,el));
  if(Number(item.auto_hide_seconds)>0){
    setTimeout(()=>{ if(document.body.contains(el)) dismissAnnouncement(item,el); },Number(item.auto_hide_seconds)*1000);
  }
}
function renderTopbar(item){
  const root=document.getElementById("announcementTopbarRoot");
  if(!root)return;
  const el=document.createElement("div");
  el.className=announcementBaseClass(item)+" ann-topbar";
  el.innerHTML=`<div class="ann-inner">${item.badge?`<span class="ann-badge">${annEscape(item.badge)}</span>`:""}<strong>${annEscape(item.title)}</strong><span>${annEscape(item.message)}</span>${announcementButton(item)}${announcementClose(item)}</div>`;
  root.appendChild(el); bindAnnouncementElement(item,el);
}
function renderTicker(items){
  const root=document.getElementById("announcementTickerRoot");
  if(!root||!items.length)return;
  const wrapper=document.createElement("div");
  wrapper.className=announcementBaseClass(items[0])+" ann-ticker";
  const content=items.map(item=>`${item.badge?`<b>${annEscape(item.badge)}</b> `:""}${annEscape(item.title)} — ${annEscape(item.message)}`).join("　　◆　　");
  wrapper.innerHTML=`<div class="ann-ticker-track"><span>${content}</span><span>${content}</span></div>`;
  root.appendChild(wrapper);
}
function renderPopup(item){
  const root=document.getElementById("announcementPopupRoot");
  if(!root)return;
  const el=document.createElement("div");
  el.className="ann-popup-overlay";
  el.innerHTML=`<div class="${announcementBaseClass(item)} ann-popup-card">${announcementClose(item)}${item.badge?`<span class="ann-badge">${annEscape(item.badge)}</span>`:""}<h3>${annEscape(item.title)}</h3><p>${annEscape(item.message)}</p>${announcementButton(item)}</div>`;
  root.appendChild(el);
  bindAnnouncementElement(item,el);
  el.querySelector(".ann-close")?.addEventListener("click",()=>dismissAnnouncement(item,el));
}
function renderFloating(item){
  const root=document.getElementById("announcementFloatingRoot");
  if(!root)return;
  const el=document.createElement("div");
  el.className=announcementBaseClass(item)+" ann-floating";
  el.innerHTML=`${announcementClose(item)}${item.badge?`<span class="ann-badge">${annEscape(item.badge)}</span>`:""}<strong>${annEscape(item.title)}</strong><p>${annEscape(item.message)}</p>${announcementButton(item)}`;
  root.appendChild(el); bindAnnouncementElement(item,el);
}
function renderToast(item){
  const root=document.getElementById("announcementToastRoot");
  if(!root)return;
  const el=document.createElement("div");
  el.className=announcementBaseClass(item)+" ann-toast";
  el.innerHTML=`${announcementClose(item)}${item.badge?`<span class="ann-badge">${annEscape(item.badge)}</span>`:""}<strong>${annEscape(item.title)}</strong><p>${annEscape(item.message)}</p>${announcementButton(item)}`;
  root.appendChild(el); bindAnnouncementElement(item,el);
}
async function loadPublicAnnouncements(){
  try{
    const {data,error}=await sb.from("announcements").select("*").eq("status","published").order("priority",{ascending:false}).order("created_at",{ascending:false});
    if(error)throw error;
    const active=(data||[]).filter(isAnnouncementActive).filter(item=>!isAnnouncementDismissed(item));
    if(!active.length)return;

    const emergency=active.find(item=>item.emergency);
    if(emergency){
      renderPopup(emergency);
      return;
    }

    const topbars=active.filter(x=>x.type==="topbar");
    const tickers=active.filter(x=>x.type==="ticker");
    const popups=active.filter(x=>x.type==="popup");
    const floating=active.filter(x=>x.type==="floating");
    const toasts=active.filter(x=>x.type==="toast");

    if(topbars[0])renderTopbar(topbars[0]);
    if(tickers.length)renderTicker(tickers);
    if(popups[0])renderPopup(popups[0]);
    if(floating[0])renderFloating(floating[0]);
    toasts.slice(0,3).forEach(renderToast);
  }catch(err){
    console.warn("Announcement Center:",err.message);
  }
}


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
let publicBracketCache=[];
let publicBracketZoom=1;
let bracketPan={active:false,x:0,y:0,left:0,top:0};

function publicRoundName(round,totalRounds){
  if(round===totalRounds)return "GRAND FINAL";
  if(round===totalRounds-1)return "SEMIFINAL";
  if(round===totalRounds-2)return "QUARTER FINAL";
  return `ROUND ${round}`;
}
function publicTeamRow(match,slot){
  const name=slot==="a"?match.team_a_name:match.team_b_name;
  const logo=slot==="a"?match.team_a_logo:match.team_b_logo;
  const score=slot==="a"?match.score_a:match.score_b;
  const winner=match.winner_slot===slot;
  const loser=match.winner_slot&&match.winner_slot!==slot;
  return `<div class="bracket-team ${winner?"is-winner":""} ${loser?"is-loser":""}">
    <div class="bracket-team-main">
      ${logo?`<img src="${esc(logo)}" alt="">`:'<span class="bracket-logo-fallback">D</span>'}
      <span class="bracket-team-name">${esc(name||"TBD")}</span>
    </div>
    <strong class="bracket-score">${score??"–"}</strong>
  </div>`;
}
function renderPublicBracket(bracket,matches){
  const el=document.getElementById("bracketWrap");
  const stage=document.getElementById("bracketStage");
  if(!bracket||!matches.length){
    el.innerHTML='<div class="empty">Bracket belum dipublikasikan.</div>';return;
  }
  const groups={};
  matches.forEach(m=>(groups[m.round_number]??=[]).push(m));
  const totalRounds=Math.log2(Number(bracket.size));
  el.innerHTML=Object.entries(groups).map(([round,roundMatches])=>`
    <section class="bracket-round-column" data-round="${round}">
      <div class="bracket-round-title">
        <span>${esc(publicRoundName(Number(round),totalRounds))}</span>
        <small>${roundMatches.length} Match</small>
      </div>
      <div class="bracket-round-matches" style="--match-count:${roundMatches.length}">
        ${roundMatches.map(m=>`
          <article class="bracket-match-card ${m.status==="live"?"is-live":""} ${m.round_number===totalRounds?"is-final":""}"
            data-public-match="${m.id}" data-source-a="${m.source_match_a||""}" data-source-b="${m.source_match_b||""}">
            <div class="bracket-match-top">
              <span>Match ${m.position}</span>
              <span class="bracket-status status-${m.status}">${m.status==="live"?"● LIVE":String(m.status||"upcoming").toUpperCase()}</span>
            </div>
            ${publicTeamRow(m,"a")}
            ${publicTeamRow(m,"b")}
            <div class="bracket-match-bottom">
              <span>BO${m.best_of||bracket.best_of||3}</span>
              <span>${m.scheduled_at?new Date(m.scheduled_at).toLocaleString():"Schedule TBA"}</span>
            </div>
          </article>`).join("")}
      </div>
    </section>`).join("");

  if(bracket.champion_name){
    el.insertAdjacentHTML("beforeend",`<section class="bracket-champion-column">
      <div class="bracket-round-title"><span>CHAMPION</span><small>Winner</small></div>
      <div class="bracket-champion-card">
        <div class="bracket-trophy">🏆</div>
        ${bracket.champion_logo?`<img src="${esc(bracket.champion_logo)}" alt="">`:""}
        <strong>${esc(bracket.champion_name)}</strong>
        <span>${esc(bracket.name)}</span>
      </div>
    </section>`);
  }
  requestAnimationFrame(()=>requestAnimationFrame(drawBracketConnectors));
}
function drawBracketConnectors(){
  const svg=document.getElementById("bracketConnectors");
  const stage=document.getElementById("bracketStage");
  if(!svg||!stage)return;
  const stageRect=stage.getBoundingClientRect();
  const width=stage.scrollWidth;
  const height=stage.scrollHeight;
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.setAttribute("width",width);
  svg.setAttribute("height",height);
  svg.innerHTML="";
  document.querySelectorAll("[data-public-match]").forEach(target=>{
    ["a","b"].forEach(slot=>{
      const sourceId=target.dataset[slot==="a"?"sourceA":"sourceB"];
      if(!sourceId)return;
      const source=document.querySelector(`[data-public-match="${sourceId}"]`);
      if(!source)return;
      const s=source.getBoundingClientRect(),t=target.getBoundingClientRect();
      const x1=(s.right-stageRect.left)/publicBracketZoom;
      const y1=(s.top+s.height/2-stageRect.top)/publicBracketZoom;
      const x2=(t.left-stageRect.left)/publicBracketZoom;
      const targetOffset=slot==="a"?t.height*.36:t.height*.64;
      const y2=(t.top+targetOffset-stageRect.top)/publicBracketZoom;
      const mid=x1+(x2-x1)/2;
      const path=document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d",`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
      path.setAttribute("class","bracket-connector-path");
      svg.appendChild(path);
    });
  });
}
async function loadBracket(){
  const el=document.getElementById("bracketWrap");
  try{
    const {data:brackets,error}=await sb.from("brackets").select("*").in("status",["published","finished"]).order("created_at",{ascending:false});
    if(error)throw error;
    publicBracketCache=brackets||[];
    if(!publicBracketCache.length){
      publicBracketSelect.innerHTML='<option value="">Belum ada bracket</option>';
      el.innerHTML='<div class="empty">Bracket belum dipublikasikan.</div>';return;
    }
    publicBracketSelect.innerHTML=publicBracketCache.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join("");
    await loadSelectedPublicBracket(publicBracketCache[0].id);
  }catch(e){
    console.warn(e);
    el.innerHTML='<div class="empty">Bracket gagal dimuat.</div>';
  }
}
async function loadSelectedPublicBracket(id){
  const bracket=publicBracketCache.find(b=>String(b.id)===String(id));
  if(!bracket)return;
  const {data,error}=await sb.from("bracket_matches").select("*").eq("bracket_id",id).order("round_number").order("position");
  if(error)throw error;
  renderPublicBracket(bracket,data||[]);
}
function applyPublicBracketZoom(){
  publicBracketZoom=Math.max(.5,Math.min(1.5,publicBracketZoom));
  bracketStage.style.transform=`scale(${publicBracketZoom})`;
  bracketZoomReset.textContent=`${Math.round(publicBracketZoom*100)}%`;
  requestAnimationFrame(drawBracketConnectors);
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

document.addEventListener('DOMContentLoaded',loadPublicAnnouncements);


/* V14.5 public bracket interaction */
publicBracketSelect?.addEventListener("change",()=>loadSelectedPublicBracket(publicBracketSelect.value));
bracketZoomIn?.addEventListener("click",()=>{publicBracketZoom+=.1;applyPublicBracketZoom()});
bracketZoomOut?.addEventListener("click",()=>{publicBracketZoom-=.1;applyPublicBracketZoom()});
bracketZoomReset?.addEventListener("click",()=>{publicBracketZoom=1;applyPublicBracketZoom()});
window.addEventListener("resize",()=>requestAnimationFrame(drawBracketConnectors));

bracketViewport?.addEventListener("pointerdown",e=>{
  if(e.target.closest("button,a,select"))return;
  bracketPan={active:true,x:e.clientX,y:e.clientY,left:bracketViewport.scrollLeft,top:bracketViewport.scrollTop};
  bracketViewport.setPointerCapture(e.pointerId);
  bracketViewport.classList.add("is-dragging");
});
bracketViewport?.addEventListener("pointermove",e=>{
  if(!bracketPan.active)return;
  bracketViewport.scrollLeft=bracketPan.left-(e.clientX-bracketPan.x);
  bracketViewport.scrollTop=bracketPan.top-(e.clientY-bracketPan.y);
});
function stopBracketPan(){bracketPan.active=false;bracketViewport?.classList.remove("is-dragging")}
bracketViewport?.addEventListener("pointerup",stopBracketPan);
bracketViewport?.addEventListener("pointercancel",stopBracketPan);
