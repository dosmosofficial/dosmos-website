
const cfg=window.DOSMOS_CONFIG;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const slugify=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fmtDate=v=>!v?"Segera diumumkan":new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(String(v).length===10?v+"T00:00:00":v));
const statusText=v=>{const s=String(v||"upcoming").toLowerCase();if(["active","ongoing","open","published"].includes(s))return "Sedang Berjalan";if(["finished","done","completed"].includes(s))return "Selesai";return "Akan Datang"};
const qs=new URLSearchParams(location.search);

menuBtn?.addEventListener("click",()=>navLinks.classList.toggle("open"));
document.querySelector(`[data-nav="${document.body.dataset.page}"]`)?.classList.add("active");

async function rows(table,order="created_at",ascending=false){
  const {data,error}=await sb.from(table).select("*").order(order,{ascending});
  if(error)throw error;return data||[];
}
async function loadSettings(){
  try{
    const {data}=await sb.from("site_settings").select("*").limit(1).maybeSingle();
    if(!data)return;
    const name=data.site_name||"DOSMOS", slogan=data.slogan||"Every Gamer Deserves a Chance.";
    document.querySelectorAll("[data-site-name]").forEach(x=>x.textContent=name);
    document.querySelectorAll("[data-site-slogan]").forEach(x=>x.textContent=slogan);
    document.querySelectorAll(".site-main-logo").forEach(x=>x.src=data.main_logo_url||"/dosmos-logo.png");
    document.querySelectorAll(".site-hero-logo").forEach(x=>x.src=data.hero_logo_url||data.main_logo_url||"/dosmos-logo.png");
    if(data.favicon_url)siteFavicon.href=data.favicon_url;
    if(/^#[0-9a-f]{6}$/i.test(data.primary_color||""))document.documentElement.style.setProperty("--gold",data.primary_color);
    if(data.hero_background_url)document.documentElement.style.setProperty("--hero-bg-image",`url("${data.hero_background_url}")`);
  }catch(e){}
}
function eventHref(e){return `/event/?slug=${encodeURIComponent(e.slug||slugify(e.title))}&id=${encodeURIComponent(e.id)}`}
function newsHref(n){return `/article/?slug=${encodeURIComponent(n.slug||slugify(n.title))}&id=${encodeURIComponent(n.id)}`}
function tournamentHref(b){return `/tournament/?slug=${encodeURIComponent(b.slug||slugify(b.name))}&id=${encodeURIComponent(b.id)}`}
function eventCard(e){const bg=e.banner?`style="background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.08)),url('${esc(e.banner)}') center/cover"`:"";return `<a class="portal-card-link" href="${eventHref(e)}"><article class="card"><div class="cover" ${bg}><div><span class="status">${esc(statusText(e.status))}</span><h3>${esc(e.title)}</h3></div></div><div class="card-body"><p class="lead">${esc(e.description||"Detail event segera diumumkan.")}</p><div class="meta-grid"><div class="meta"><small>Mulai</small><strong>${esc(fmtDate(e.start_date))}</strong></div><div class="meta"><small>Prize Pool</small><strong>${esc(e.prize_pool||"-")}</strong></div></div><div class="portal-card-cta"><span>Buka Event</span><span>→</span></div></div></article></a>`}
function newsCard(n){const bg=n.cover?`style="background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.08)),url('${esc(n.cover)}') center/cover"`:"";return `<a class="portal-card-link" href="${newsHref(n)}"><article class="card"><div class="cover" ${bg}><div><span class="status">NEWS</span><h3>${esc(n.title)}</h3></div></div><div class="card-body"><p class="lead">${esc(n.summary||"Baca informasi selengkapnya.")}</p><div class="portal-card-cta"><span>${esc(fmtDate(n.published_at))}</span><span>Baca →</span></div></div></article></a>`}
function tournamentCard(b){return `<a class="portal-card-link" href="${tournamentHref(b)}"><article class="card"><div class="cover"><div><span class="status">${esc(String(b.status||"published").toUpperCase())}</span><h3>${esc(b.name)}</h3></div></div><div class="card-body"><p class="lead">${Number(b.size)||0} slot • Best of ${Number(b.best_of)||1} • Single Elimination</p><div class="portal-card-cta"><span>Buka Tournament</span><span>→</span></div></div></article></a>`}
function filterCards(cache,renderer,target,kind){
  const search=(portalSearch?.value||"").toLowerCase();
  const status=portalStatusFilter?.value||"all";
  const out=cache.filter(x=>{
    const txt=kind==="tournament"?x.name:x.title;
    return (!search||String(txt||"").toLowerCase().includes(search))&&(status==="all"||x.status===status);
  });
  target.innerHTML=out.length?out.map(renderer).join(""):'<div class="empty">Tidak ada data yang cocok.</div>';
}
async function initHome(){
  const [events,news,brackets,gallery]=await Promise.allSettled([rows("events","start_date",true),rows("news","published_at",false),rows("brackets","created_at",false),rows("gallery","created_at",false)]);
  homeEventGrid.innerHTML=events.value?.slice(0,3).map(eventCard).join("")||'<div class="empty">Belum ada event.</div>';
  homeNewsGrid.innerHTML=news.value?.slice(0,3).map(newsCard).join("")||'<div class="empty">Belum ada berita.</div>';
  const b=brackets.value?.find(x=>x.status==="published")||brackets.value?.[0];
  homeTournamentFeature.innerHTML=b?`<div class="portal-section-head"><div><span class="status">${esc(String(b.status||"draft").toUpperCase())}</span><h2>${esc(b.name)}</h2><p class="lead">${b.size} tim • BO${b.best_of}</p></div><a class="btn btn-primary" href="${tournamentHref(b)}">Buka Bracket</a></div>`:'<div class="empty">Belum ada tournament.</div>';
  homeGalleryGrid.innerHTML=gallery.value?.slice(0,4).map(g=>`<article class="card"><div class="cover" style="background:url('${esc(g.image_url)}') center/cover"><h3>${esc(g.caption||"DOSMOS Moment")}</h3></div></article>`).join("")||'<div class="empty">Belum ada gallery.</div>';
  await renderLive(true);
}
async function initEvents(){
  const cache=await rows("events","start_date",true);filterCards(cache,eventCard,portalEventGrid,"event");
  [portalSearch,portalStatusFilter].forEach(x=>x?.addEventListener(x.tagName==="INPUT"?"input":"change",()=>filterCards(cache,eventCard,portalEventGrid,"event")));
}
async function initTournaments(){
  const cache=(await rows("brackets","created_at",false)).filter(x=>x.status!=="draft");filterCards(cache,tournamentCard,portalTournamentGrid,"tournament");
  [portalSearch,portalStatusFilter].forEach(x=>x?.addEventListener(x.tagName==="INPUT"?"input":"change",()=>filterCards(cache,tournamentCard,portalTournamentGrid,"tournament")));
}
async function initNews(){
  const cache=await rows("news","published_at",false);filterCards(cache,newsCard,portalNewsGrid,"news");
  portalSearch?.addEventListener("input",()=>filterCards(cache,newsCard,portalNewsGrid,"news"));
}
async function initGallery(){
  const cache=await rows("gallery","created_at",false);
  const render=()=>{const q=(portalSearch.value||"").toLowerCase();const data=cache.filter(g=>`${g.caption||""} ${g.event_name||""}`.toLowerCase().includes(q));portalGalleryGrid.innerHTML=data.map(g=>`<article class="portal-gallery-item" data-image="${esc(g.image_url)}" data-caption="${esc(g.caption||"DOSMOS Moment")}"><img src="${esc(g.image_url)}" alt="${esc(g.caption||"DOSMOS Moment")}" loading="lazy"><div><strong>${esc(g.caption||"DOSMOS Moment")}</strong><small>${esc(g.event_name||"")}</small></div></article>`).join("")||'<div class="empty">Belum ada gallery.</div>'};render();portalSearch.addEventListener("input",render);
  portalGalleryGrid.addEventListener("click",e=>{const item=e.target.closest("[data-image]");if(!item)return;portalLightboxImage.src=item.dataset.image;portalLightboxCaption.textContent=item.dataset.caption;portalLightbox.hidden=false});
  portalLightboxClose.onclick=()=>portalLightbox.hidden=true;portalLightbox.onclick=e=>{if(e.target===portalLightbox)portalLightbox.hidden=true};
}
async function initHall(){const data=await rows("champions","created_at",false);portalChampionGrid.innerHTML=data.length?data.map(c=>`<article class="card"><div class="cover" ${c.photo?`style="background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.08)),url('${esc(c.photo)}') center/cover"`:""}><div><span class="status">${esc(c.rank||"CHAMPION")}</span><h3>${esc(c.team_name)}</h3></div></div><div class="card-body"><p class="lead">${esc(c.story||"Every victory has a story.")}</p><div class="meta-grid"><div class="meta"><small>Event</small><strong>${esc(c.event_name||"-")}</strong></div><div class="meta"><small>MVP</small><strong>${esc(c.mvp||"-")}</strong></div><div class="meta"><small>Prize</small><strong>${esc(c.prize||"-")}</strong></div></div></div></article>`).join(""):'<div class="empty">Belum ada champion.</div>'}
async function initRegister(){
  try{const events=await rows("events","start_date",true);reg_event.innerHTML='<option value="">Pilih event</option>'+events.filter(e=>e.status!=="finished").map(e=>`<option>${esc(e.title)}</option>`).join("")}catch{}
  registrationForm.addEventListener("submit",async e=>{e.preventDefault();registrationMessage.textContent="Mengirim...";const payload={event_name:reg_event.value.trim(),team_name:reg_team.value.trim(),captain_name:reg_captain.value.trim(),whatsapp:reg_whatsapp.value.trim(),roster:reg_roster.value.trim(),notes:reg_notes.value.trim(),status:"pending"};const {error}=await sb.from("registrations").insert(payload);registrationMessage.textContent=error?error.message:"Pendaftaran berhasil dikirim.";if(!error)registrationForm.reset()});
}
async function findBySlug(table,titleCol){
  const id=qs.get("id"),slug=qs.get("slug");let q=sb.from(table).select("*");
  if(id){const {data}=await q.eq("id",id).maybeSingle();if(data)return data}
  const {data}=await sb.from(table).select("*");return (data||[]).find(x=>(x.slug||slugify(x[titleCol]))===slug);
}
function setSeo(title,desc,image=""){document.title=`${title} | DOSMOS`;siteMetaDescription.content=desc||title;ogTitle.content=document.title;ogDescription.content=desc||title;if(image)ogImage.content=image}
async function initEventDetail(){
  const e=await findBySlug("events","title");if(!e){detailTitle.textContent="Event tidak ditemukan";return}
  detailTitle.textContent=e.title;detailBreadcrumb.textContent=e.title;detailSummary.textContent=e.description||"";detailStatus.textContent=statusText(e.status);detailContent.textContent=e.description||"Detail event segera diumumkan.";if(e.banner){detailBanner.style.backgroundImage=`url("${e.banner}")`;detailHero.style.background=`linear-gradient(to top,rgba(5,5,5,.98),rgba(5,5,5,.42)),url("${e.banner}") center/cover`}
  detailSidebar.innerHTML=`<div class="portal-info-card"><small>Mulai</small><strong>${esc(fmtDate(e.start_date))}</strong></div><div class="portal-info-card"><small>Selesai</small><strong>${esc(fmtDate(e.end_date))}</strong></div><div class="portal-info-card"><small>Prize Pool</small><strong>${esc(e.prize_pool||"-")}</strong></div>${e.registration_link?`<a class="btn btn-primary" target="_blank" href="${esc(e.registration_link)}">Daftar Event</a>`:`<a class="btn btn-primary" href="/register/">Daftar Tim</a>`}`;
  const {data:brackets}=await sb.from("brackets").select("*").eq("event_id",e.id);const b=(brackets||[])[0];detailBracketFeature.innerHTML=b?`<h3>${esc(b.name)}</h3><p class="lead">${b.size} slot • BO${b.best_of}</p><a class="btn btn-primary" href="${tournamentHref(b)}">Buka Tournament</a>`:'<div class="empty">Bracket event belum tersedia.</div>';setSeo(e.seo_title||e.title,e.seo_description||e.description,e.banner)
}
async function initArticle(){
  const n=await findBySlug("news","title");if(!n){detailTitle.textContent="Berita tidak ditemukan";return}
  detailTitle.textContent=n.title;detailBreadcrumb.textContent=n.title;detailSummary.textContent=n.summary||"";detailContent.textContent=n.content||n.summary||"";detailMeta.textContent=fmtDate(n.published_at);if(n.cover){detailBanner.style.backgroundImage=`url("${n.cover}")`;detailHero.style.background=`linear-gradient(to top,rgba(5,5,5,.98),rgba(5,5,5,.42)),url("${n.cover}") center/cover`}
  const all=await rows("news","published_at",false);relatedNewsGrid.innerHTML=all.filter(x=>x.id!==n.id).slice(0,3).map(newsCard).join("");setSeo(n.seo_title||n.title,n.seo_description||n.summary,n.cover)
}
let bracketZoom=1;
function teamRow(m,slot){const n=slot==="a"?m.team_a_name:m.team_b_name,l=slot==="a"?m.team_a_logo:m.team_b_logo,s=slot==="a"?m.score_a:m.score_b,w=m.winner_slot===slot;return `<div class="bracket-team ${w?"is-winner":""}"><div class="bracket-team-main">${l?`<img src="${esc(l)}">`:'<span class="bracket-logo-fallback">D</span>'}<span class="bracket-team-name">${esc(n||"TBD")}</span></div><strong class="bracket-score">${s??"–"}</strong></div>`}
function renderBracket(b,matches){const groups={};matches.forEach(m=>(groups[m.round_number]??=[]).push(m));bracketWrap.innerHTML=Object.entries(groups).map(([r,ms])=>`<section class="bracket-round-column"><div class="bracket-round-title"><span>ROUND ${r}</span></div><div class="bracket-round-matches">${ms.map(m=>`<article class="bracket-match-card">${teamRow(m,"a")}${teamRow(m,"b")}</article>`).join("")}</div></section>`).join("");bracketStage.style.transform=`scale(${bracketZoom})`;bracketZoomReset.textContent=`${Math.round(bracketZoom*100)}%`}
async function initTournament(){
  const b=await findBySlug("brackets","name");if(!b){detailTitle.textContent="Tournament tidak ditemukan";return}
  detailTitle.textContent=b.name;detailBreadcrumb.textContent=b.name;detailStatus.textContent=String(b.status||"TOURNAMENT").toUpperCase();detailSummary.textContent=`${b.size} slot • Best of ${b.best_of} • Single Elimination`;detailContent.textContent=b.description||"Tournament resmi DOSMOS dengan bracket single elimination.";detailSidebar.innerHTML=`<div class="portal-info-card"><small>Format</small><strong>Single Elimination</strong></div><div class="portal-info-card"><small>Slot</small><strong>${b.size} Tim</strong></div><div class="portal-info-card"><small>Match</small><strong>Best of ${b.best_of}</strong></div><div class="portal-info-card"><small>Status</small><strong>${esc(b.status||"-")}</strong></div>`;
  if(b.event_id){const {data:e}=await sb.from("events").select("*").eq("id",b.event_id).maybeSingle();if(e){detailContent.textContent=e.description||detailContent.textContent;if(e.banner){detailBanner.style.backgroundImage=`url("${e.banner}")`;detailHero.style.background=`linear-gradient(to top,rgba(5,5,5,.98),rgba(5,5,5,.42)),url("${e.banner}") center/cover`}}}
  const {data:matches}=await sb.from("bracket_matches").select("*").eq("bracket_id",b.id).order("round_number").order("match_number");renderBracket(b,matches||[]);
  const teams=[];(matches||[]).forEach(m=>{[["a",m.team_a_name,m.team_a_logo],["b",m.team_b_name,m.team_b_logo]].forEach(([,n,l])=>{if(n&&!teams.some(x=>x.n===n))teams.push({n,l})})});tournamentTeams.innerHTML=teams.map(t=>`<div class="portal-team-card">${t.l?`<img src="${esc(t.l)}">`:'<span class="bracket-logo-fallback">D</span>'}<span>${esc(t.n)}</span></div>`).join("")||'<div class="empty">Tim belum diisi.</div>';tournamentRules.textContent=b.rules||"Rules turnamen akan diumumkan oleh admin DOSMOS.";const final=(matches||[]).sort((a,c)=>c.round_number-a.round_number)[0];tournamentResults.innerHTML=final?.winner_name?`<div class="portal-result-card"><small>CHAMPION</small><strong>${esc(final.winner_name)}</strong></div>`:'<div class="empty">Tournament belum selesai.</div>';
  document.querySelectorAll("[data-tournament-tab]").forEach(btn=>btn.onclick=()=>{document.querySelectorAll("[data-tournament-tab]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tournament-tab-panel").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.getElementById(`tournament-${btn.dataset.tournamentTab}`).classList.add("active")});
  bracketZoomIn.onclick=()=>{bracketZoom=Math.min(1.5,bracketZoom+.1);renderBracket(b,matches||[])};bracketZoomOut.onclick=()=>{bracketZoom=Math.max(.5,bracketZoom-.1);renderBracket(b,matches||[])};bracketZoomReset.onclick=()=>{bracketZoom=1;renderBracket(b,matches||[])};setSeo(b.name,detailSummary.textContent)
}
let countdownTimer;
async function renderLive(homeOnly=false){
  try{
    const {data:d}=await sb.from("site_settings").select("*").limit(1).maybeSingle();
    if(!d)return;
    const status=String(d.live_status||"offline").toLowerCase();
    const isLive=status==="live";
    const title=d.live_title||"DOSMOS Live";
    const url=d.live_url||"#";
    const thumb=d.live_thumbnail_url||"";
    const videoId=youtubeVideoId(url);
    if(homeOnly){
      homeLiveFeature.innerHTML=`<div class="portal-section-head"><div><span class="live-status-pill ${isLive?"is-live":"is-offline"}">${isLive?"LIVE":"OFFLINE"}</span><h2>${esc(title)}</h2><p class="lead">${esc(d.live_description||"Live berikutnya segera hadir.")}</p></div><a class="btn btn-primary" href="/live/">Buka Live Center</a></div>`;
      return;
    }
    liveStreamTitle.textContent=title;
    liveStreamDescription.textContent=d.live_description||"";
    liveChannelName.textContent=d.live_channel_name||"DOSMOS Official";
    livePlatformLabel.textContent=(d.live_platform||"youtube").toUpperCase();
    liveWatchButton.href=url;
    liveStatusPill.textContent=liveStatusSide.textContent=isLive?"LIVE":"OFFLINE";
    liveStatusPill.className=liveStatusSide.className=`live-status-pill ${isLive?"is-live":"is-offline"}`;
    livePlaceholderTitle.textContent=title;
    livePlaceholderText.textContent=d.live_description||"Live berikutnya segera hadir.";
    if(isLive&&videoId){
      liveFrame.innerHTML=`<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }else if(thumb){
      liveFrame.style.background=`linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,.55)),url("${thumb}") center/cover`;
    }
    renderOfficialLiveChat(d,videoId);
  }catch(e){console.error("Live Center:",e)}
}
async function boot(){
  await loadSettings();
  const p=document.body.dataset.page;
  try{
    if(p==="home")await initHome();if(p==="events"&&portalEventGrid)await initEvents();if(p==="tournaments"&&portalTournamentGrid)await initTournaments();if(p==="news"&&portalNewsGrid)await initNews();if(p==="gallery")await initGallery();if(p==="hall")await initHall();if(p==="register")await initRegister();if(p==="live")await renderLive();if(p==="community")await initCommunity();if(p==="donate")await initDonate();if(location.pathname.startsWith("/event/"))await initEventDetail();if(location.pathname.startsWith("/article/"))await initArticle();if(location.pathname.startsWith("/tournament/"))await initTournament();
  }catch(e){console.error(e)}
}
boot();


/* =========================================================
   DOSMOS VIP V14.7.1 — PORTAL POLISH
========================================================= */
function injectPortalLoader(){
  if(document.getElementById("portalPageLoader"))return;
  const loader=document.createElement("div");
  loader.id="portalPageLoader";
  loader.className="portal-page-loader";
  loader.innerHTML='<div class="portal-loader-mark">D</div><span>Loading DOSMOS</span>';
  document.body.appendChild(loader);
  requestAnimationFrame(()=>loader.classList.add("is-visible"));
  window.addEventListener("load",()=>setTimeout(()=>loader.classList.remove("is-visible"),180));
}
injectPortalLoader();

document.addEventListener("click",e=>{
  const link=e.target.closest("a[href]");
  if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
  const href=link.getAttribute("href");
  if(!href||href.startsWith("#")||href.startsWith("mailto:")||href.startsWith("tel:"))return;
  try{
    const url=new URL(href,location.href);
    if(url.origin!==location.origin)return;
    const loader=document.getElementById("portalPageLoader");
    loader?.classList.add("is-visible");
  }catch{}
});

const portalObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("portal-reveal-visible");
      portalObserver.unobserve(entry.target);
    }
  });
},{threshold:.08,rootMargin:"0px 0px -30px 0px"});
function activatePortalReveal(){
  document.querySelectorAll(".card,.portal-feature-panel,.portal-detail-content,.portal-detail-sidebar,.portal-gallery-item,.portal-info-card").forEach(el=>{
    el.classList.add("portal-reveal");
    portalObserver.observe(el);
  });
}
setTimeout(activatePortalReveal,120);

function markImageLoaded(img){
  img.classList.add("portal-image-ready");
}
document.querySelectorAll("img").forEach(img=>{
  img.loading=img.loading||"lazy";
  if(img.complete)markImageLoaded(img);else img.addEventListener("load",()=>markImageLoaded(img),{once:true});
});
const portalMutationObserver=new MutationObserver(()=>{
  document.querySelectorAll("img:not([data-polished])").forEach(img=>{
    img.dataset.polished="true";
    img.loading=img.loading||"lazy";
    if(img.complete)markImageLoaded(img);else img.addEventListener("load",()=>markImageLoaded(img),{once:true});
  });
  activatePortalReveal();
});
portalMutationObserver.observe(document.body,{subtree:true,childList:true});

function youtubeVideoId(url=""){
  return (String(url).match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]{6,})/)||[])[1]||"";
}
function youtubeChatUrl(videoId){
  const host=location.hostname;
  if(!videoId||!host)return "";
  return `https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${encodeURIComponent(host)}&dark_theme=1`;
}
function renderOfficialLiveChat(settings,videoId){
  const panel=document.getElementById("liveChatPanel");
  const frame=document.getElementById("liveChatFrame");
  const toggle=document.getElementById("liveChatToggle");
  if(!panel||!frame)return;
  const enabled=settings.live_chat_enabled!==false&&settings.live_chat_mode!=="hidden";
  const youtube=String(settings.live_platform||"youtube").toLowerCase()==="youtube";
  if(enabled&&youtube&&videoId){
    frame.innerHTML=`<iframe title="YouTube Live Chat" src="${youtubeChatUrl(videoId)}" allow="clipboard-write" loading="lazy"></iframe>`;
    panel.classList.remove("is-unavailable");
  }else{
    panel.classList.add("is-unavailable");
    frame.innerHTML=`<div class="live-chat-placeholder"><strong>${youtube?"Chat belum tersedia":"Live chat belum didukung"}</strong><p>${youtube?"Pastikan link YouTube Live sudah benar dan live chat di YouTube diaktifkan.":"TikTok belum menyediakan live chat embed resmi untuk website biasa."}</p></div>`;
  }
  toggle?.addEventListener("click",()=>{
    panel.classList.toggle("is-collapsed");
    toggle.textContent=panel.classList.contains("is-collapsed")?"Tampilkan Chat":"Sembunyikan Chat";
  });
}


/* =========================================================
   DOSMOS VIP V14.8 — COMMUNITY HUB
========================================================= */
const rupiah=value=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value||0));

async function communitySettings(){
  const {data}=await sb.from("site_settings").select("*").limit(1).maybeSingle();
  return data||{};
}
function supporterBadge(total){
  const n=Number(total||0);
  if(n>=5000000)return {icon:"💎",name:"Diamond"};
  if(n>=1000000)return {icon:"🥇",name:"Gold"};
  if(n>=250000)return {icon:"🥈",name:"Silver"};
  return {icon:"🥉",name:"Bronze"};
}
async function loadSupporters(target){
  if(!target)return;
  const {data,error}=await sb.from("donations").select("donor_name,anonymous,amount,status").eq("status","paid");
  if(error){target.innerHTML='<div class="empty">Supporter belum tersedia.</div>';return}
  const totals={};
  (data||[]).forEach(d=>{const name=d.anonymous?"Anonymous":d.donor_name||"Anonymous";totals[name]=(totals[name]||0)+Number(d.amount||0)});
  const list=Object.entries(totals).map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total).slice(0,12);
  target.innerHTML=list.length?list.map((s,i)=>{const badge=supporterBadge(s.total);return `<article class="supporter-card"><span class="supporter-rank">${i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}</span><div><strong>${esc(s.name)}</strong><small>${badge.icon} ${badge.name} Supporter</small></div><b>${rupiah(s.total)}</b></article>`}).join(""):'<div class="empty">Belum ada supporter.</div>';
}
async function initCommunity(){
  const settings=await communitySettings();
  communityLiveTitle.textContent=settings.live_title||"DOSMOS Watch Party";
  communityLiveDescription.textContent=settings.live_description||"Live berikutnya segera hadir.";
  communityPlatform.textContent=(settings.live_platform||"DOSMOS LIVE").toUpperCase();
  communityChannel.textContent=settings.live_channel_name||"DOSMOS Official";
  const liveUrl=settings.live_url||settings.community_tiktok_url||"/live/";
  communityExternalLive.href=liveUrl;
  if(liveUrl!="/live/")communityExternalLive.target="_blank";
  const isLive=String(settings.live_status||"offline")==="live";
  communityLiveStatus.textContent=isLive?"LIVE":"OFFLINE";
  communityLiveStatus.className=`live-status-pill ${isLive?"is-live":"is-offline"}`;
  const yt=youtubeVideoId(settings.live_url||"");
  if(isLive&&yt)communityPlayer.innerHTML=`<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  else if(settings.community_tiktok_url){
    communityPlayer.innerHTML=`<div class="tiktok-live-fallback"><span class="tiktok-mark">♪</span><h2>TikTok Live DOSMOS</h2><p>TikTok tidak menyediakan player dan komentar live resmi penuh untuk website. Buka live TikTok, lalu kembali ke sini untuk ngobrol di DOSMOS Chat.</p><a class="btn btn-primary" href="${esc(settings.community_tiktok_url)}" target="_blank" rel="noopener">Buka TikTok Live</a></div>`;
  }
  communityDisplayName.value=localStorage.getItem("dosmos_chat_name")||"";
  communitySaveName.onclick=()=>{const name=communityDisplayName.value.trim();if(name){localStorage.setItem("dosmos_chat_name",name);communitySaveName.textContent="Tersimpan";setTimeout(()=>communitySaveName.textContent="Simpan",1000)}};
  await loadCommunityMessages();
  communityChatForm.onsubmit=sendCommunityMessage;
  sb.channel("community-chat-live").on("postgres_changes",{event:"INSERT",schema:"public",table:"community_messages"},()=>loadCommunityMessages()).on("postgres_changes",{event:"UPDATE",schema:"public",table:"community_messages"},()=>loadCommunityMessages()).subscribe();
  renderCommunityPoll(settings);
  await loadSupporters(communitySupporters);
}
async function loadCommunityMessages(){
  const {data,error}=await sb.from("community_messages").select("*").eq("is_hidden",false).order("created_at",{ascending:true}).limit(100);
  if(error){communityMessages.innerHTML='<div class="empty">Chat belum tersedia.</div>';return}
  communityMessages.innerHTML=(data||[]).length?(data||[]).map(m=>`<div class="community-message"><div class="community-avatar">${esc((m.display_name||"D")[0].toUpperCase())}</div><div><div class="community-message-meta"><strong>${esc(m.display_name||"Guest")}</strong><span>${new Date(m.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</span></div><p>${esc(m.message)}</p></div></div>`).join(""):'<div class="empty">Jadilah yang pertama mengirim pesan.</div>';
  communityMessages.scrollTop=communityMessages.scrollHeight;
}
async function sendCommunityMessage(e){
  e.preventDefault();
  const name=(communityDisplayName.value||localStorage.getItem("dosmos_chat_name")||"").trim();
  const message=communityChatInput.value.trim();
  if(!name){alert("Isi nama kamu terlebih dahulu.");communityDisplayName.focus();return}
  if(!message)return;
  localStorage.setItem("dosmos_chat_name",name);
  const visitorId=localStorage.getItem("dosmos_visitor_id")||crypto.randomUUID();
  localStorage.setItem("dosmos_visitor_id",visitorId);
  communityChatInput.disabled=true;
  const {error}=await sb.from("community_messages").insert({display_name:name,message,visitor_id:visitorId});
  communityChatInput.disabled=false;
  if(error){alert(error.message);return}
  communityChatInput.value="";communityChatInput.focus();
}
async function renderCommunityPoll(settings){
  if(!settings.community_poll_enabled){communityPollCard.hidden=true;return}
  communityPollCard.hidden=false;
  pollQuestion.textContent=settings.community_poll_question||"Siapa yang akan menang?";
  const opts=[settings.community_poll_a||"Team A",settings.community_poll_b||"Team B"];
  const {data:votes}=await sb.from("community_poll_votes").select("option_key");
  const counts={a:0,b:0};(votes||[]).forEach(v=>counts[v.option_key]=(counts[v.option_key]||0)+1);
  const total=counts.a+counts.b;
  pollOptions.innerHTML=opts.map((o,i)=>{const key=i===0?"a":"b",pct=total?Math.round(counts[key]/total*100):0;return `<button type="button" data-poll-option="${key}"><span><strong>${esc(o)}</strong><b>${pct}%</b></span><i style="width:${pct}%"></i></button>`}).join("");
  pollOptions.onclick=async e=>{const btn=e.target.closest("[data-poll-option]");if(!btn)return;const visitorId=localStorage.getItem("dosmos_visitor_id")||crypto.randomUUID();localStorage.setItem("dosmos_visitor_id",visitorId);const {error}=await sb.from("community_poll_votes").upsert({visitor_id:visitorId,option_key:btn.dataset.pollOption},{onConflict:"visitor_id"});if(error)alert(error.message);else renderCommunityPoll(settings)};
}
async function initDonate(){
  const settings=await communitySettings();
  const qris=settings.donation_qris_url||"/dosmos-logo.png";
  donationQrisPreview.src=qris;donationModalQris.src=qris;
  donationGoalTitle.textContent=settings.donation_goal_title||"Community Development";
  donationGoalTarget.textContent=rupiah(settings.donation_goal_target||10000000);
  const {data:paid}=await sb.from("donations").select("amount").eq("status","paid");
  const current=(paid||[]).reduce((s,d)=>s+Number(d.amount||0),0),target=Number(settings.donation_goal_target||10000000),pct=Math.min(100,target?Math.round(current/target*100):0);
  donationGoalCurrent.textContent=rupiah(current);donationProgressBar.style.width=`${pct}%`;donationGoalPercent.textContent=`${pct}% tercapai`;
  donateAmountGrid.onclick=e=>{const b=e.target.closest("[data-amount]");if(!b)return;document.querySelectorAll("[data-amount]").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(b.dataset.amount==="custom"){donationAmount.value="";donationAmount.focus()}else donationAmount.value=b.dataset.amount};
  donationForm.onsubmit=async e=>{e.preventDefault();const amount=Number(donationAmount.value),min=Number(settings.donation_minimum||10000);if(amount<min){donationFormMessage.textContent=`Minimum donation ${rupiah(min)}.`;return}const ref=`DSM-${Date.now().toString(36).toUpperCase()}`;const payload={reference:ref,donor_name:donorName.value.trim(),amount,message:donationMessage.value.trim(),anonymous:donationAnonymous.checked,status:"pending"};const {error}=await sb.from("donations").insert(payload);if(error){donationFormMessage.textContent=error.message;return}donationModalAmount.textContent=rupiah(amount);donationReference.textContent=ref;donationModal.hidden=false;donationPaidButton.dataset.reference=ref};
  donationModalClose.onclick=()=>donationModal.hidden=true;
  donationModal.onclick=e=>{if(e.target===donationModal)donationModal.hidden=true};
  donationPaidButton.onclick=async()=>{const ref=donationPaidButton.dataset.reference;const {error}=await sb.from("donations").update({status:"waiting_confirmation",updated_at:new Date().toISOString()}).eq("reference",ref);donationModalMessage.textContent=error?error.message:"Konfirmasi terkirim. Admin akan memeriksa pembayaran kamu.";donationPaidButton.disabled=!error};
  await loadSupporters(donateSupporters);
}


document.querySelectorAll("[data-current-year]").forEach(el=>el.textContent=new Date().getFullYear());
