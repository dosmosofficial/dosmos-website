
const cfg=window.DOSMOS_CONFIG;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const loginView=document.getElementById("loginView");
const dashboardView=document.getElementById("dashboardView");
const authMessage=document.getElementById("authMessage");

// Mobile sidebar
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const adminSidebar = document.getElementById("adminSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

function openAdminSidebar(){
  adminSidebar?.classList.add("open");
  sidebarOverlay?.classList.add("show");
  document.body.classList.add("admin-menu-open");
  mobileMenuBtn?.setAttribute("aria-expanded","true");
}

function closeAdminSidebar(){
  adminSidebar?.classList.remove("open");
  sidebarOverlay?.classList.remove("show");
  document.body.classList.remove("admin-menu-open");
  mobileMenuBtn?.setAttribute("aria-expanded","false");
}

mobileMenuBtn?.addEventListener("click", openAdminSidebar);
sidebarCloseBtn?.addEventListener("click", closeAdminSidebar);
sidebarOverlay?.addEventListener("click", closeAdminSidebar);

document.querySelectorAll(".side-nav [data-tab], .side-nav a").forEach(item=>{
  item.addEventListener("click", closeAdminSidebar);
});

sidebarLogoutBtn?.addEventListener("click", async ()=>{
  await sb.auth.signOut();
  location.reload();
});

window.addEventListener("resize", ()=>{
  if(window.innerWidth > 980) closeAdminSidebar();
});

const editState={events:null,matches:null,champions:null,news:null,gallery:null,sponsors:null};
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const msg=(el,text,type="")=>{el.textContent=text;el.className="message "+type};

async function checkSession(){
  const {data:{session}}=await sb.auth.getSession();
  if(session){loginView.classList.add("hidden");dashboardView.classList.remove("hidden");await refreshAll()}
  else{loginView.classList.remove("hidden");dashboardView.classList.add("hidden")}
}
document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();msg(authMessage,"Memproses...");
  const {error}=await sb.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});
  if(error){msg(authMessage,error.message,"error");return}
  await checkSession();
});
logoutBtn.addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  btn.classList.add("active");document.getElementById(btn.dataset.tab).classList.add("active");
}));
function mediaCategoryFromFolder(folder="other"){
  const first=String(folder).split("/")[0].toLowerCase();
  const map={branding:"logo",events:"tournament",champions:"player",gallery:"gallery",news:"news",sponsors:"sponsor","live-center":"live",teams:"team",players:"player"};
  return map[first]||first||"other";
}
async function registerMediaAsset({file,path,url,category,status="active",displayName=null}){
  const payload={
    original_name:file?.name||displayName||"media",
    display_name:displayName||file?.name||"Media DOSMOS",
    storage_path:path||null,
    public_url:url,
    category:category||"other",
    status,
    mime_type:file?.type||null,
    file_size:file?.size||0,
    updated_at:new Date().toISOString()
  };
  const {error}=await sb.from("media_assets").insert(payload);
  if(error)console.warn("Media Library registration:",error.message);
}
async function uploadMedia(file,folder,options={}){
  if(!file)return null;
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from(cfg.storageBucket).upload(path,file,{cacheControl:"3600"});
  if(error)throw error;
  const url=sb.storage.from(cfg.storageBucket).getPublicUrl(path).data.publicUrl;
  await registerMediaAsset({
    file,path,url,
    category:options.category||mediaCategoryFromFolder(folder),
    status:options.status||"active",
    displayName:options.displayName||file.name
  });
  return url;
}
async function rows(table,order="created_at",asc=false){
  const {data,error}=await sb.from(table).select("*").order(order,{ascending:asc});
  if(error)throw error;return data||[];
}
function showTab(id){document.querySelector(`[data-tab="${id}"]`)?.click();window.scrollTo({top:0,behavior:"smooth"})}
window.deleteRow=async(table,id)=>{if(!confirm("Hapus data ini?"))return;const {error}=await sb.from(table).delete().eq("id",id);if(error){alert(error.message);return}await refreshAll()};
async function refreshAll(){
  await Promise.all([loadEvents(),loadRegistrations(),loadTournamentBrackets(),loadChampions(),loadNews(),loadGallery(),loadSponsors(),loadSettings(),loadBranding(),loadWebsiteContent(),loadLiveCenter(),loadAnnouncements(),loadMediaLibrary()]);
  const tables=["events","registrations","brackets","champions","news","gallery","sponsors"];
  for(const t of tables){
    const statId=t==="brackets"?"stat_matches":"stat_"+t;
    const statEl=document.getElementById(statId);
    if(statEl)statEl.textContent=(await rows(t)).length;
  }
}
function makeFormHandler({formId,table,stateKey,payloadFn,messageId,submitId,after}){
  document.getElementById(formId).addEventListener("submit",async e=>{
    e.preventDefault();const out=document.getElementById(messageId);
    try{
      const payload=await payloadFn();
      const q=editState[stateKey]?sb.from(table).update(payload).eq("id",editState[stateKey]):sb.from(table).insert(payload);
      const {error}=await q;if(error)throw error;
      msg(out,"Data berhasil disimpan.","success");editState[stateKey]=null;e.target.reset();document.getElementById(submitId).textContent="Publish";after&&after();await refreshAll();
    }catch(err){msg(out,err.message,"error")}
  });
}

/* events */
async function loadEvents(){
  const data=await rows("events");
  eventRows.innerHTML=data.map(e=>`<tr><td>${esc(e.title)}</td><td>${esc(e.status||"")}</td><td>${esc(e.start_date||"-")}</td><td>${esc(e.prize_pool||"-")}</td><td><button class="btn btn-secondary" onclick='editEvent(${JSON.stringify(e)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('events','${e.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada event.</td></tr>';
}
window.editEvent=e=>{editState.events=e.id;["title","slug","description","banner","start_date","end_date","prize_pool","registration_link","status","seo_title","seo_description"].forEach(k=>document.getElementById("event_"+k).value=e[k]||"");eventSubmit.textContent="Simpan Perubahan";showTab("eventsTab")};
makeFormHandler({formId:"eventForm",table:"events",stateKey:"events",messageId:"eventMessage",submitId:"eventSubmit",payloadFn:async()=>{
  let banner=event_banner.value.trim()||null;if(event_file.files[0])banner=await uploadMedia(event_file.files[0],"events");
  return {title:event_title.value.trim(),slug:event_slug.value.trim()||slugify(event_title.value),description:event_description.value.trim(),banner,start_date:event_start_date.value||null,end_date:event_end_date.value||null,prize_pool:event_prize_pool.value.trim()||null,registration_link:event_registration_link.value.trim()||null,status:event_status.value,seo_title:event_seo_title.value.trim()||null,seo_description:event_seo_description.value.trim()||null,updated_at:new Date().toISOString()}
}});

/* registrations */
async function loadRegistrations(){
  const data=await rows("registrations");
  registrationRows.innerHTML=data.map(r=>`<tr><td>${esc(r.event_name)}</td><td>${esc(r.team_name)}</td><td>${esc(r.captain_name)}</td><td>${esc(r.whatsapp)}</td><td>${esc(r.status)}</td><td><select onchange="updateRegistration('${r.id}',this.value)"><option ${r.status==="pending"?"selected":""} value="pending">Pending</option><option ${r.status==="accepted"?"selected":""} value="accepted">Accepted</option><option ${r.status==="rejected"?"selected":""} value="rejected">Rejected</option></select></td><td><button class="btn btn-danger" onclick="deleteRow('registrations','${r.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="7">Belum ada pendaftaran.</td></tr>';
}
window.updateRegistration=async(id,status)=>{const {error}=await sb.from("registrations").update({status}).eq("id",id);if(error)alert(error.message)};

/* Legacy match form replaced by V14.5 Tournament Bracket Center. */

/* champions */
async function loadChampions(){
  const data=await rows("champions");
  championRows.innerHTML=data.map(c=>`<tr><td>${esc(c.team_name)}</td><td>${esc(c.rank||"")}</td><td>${esc(c.event_name||"-")}</td><td>${esc(c.mvp||"-")}</td><td><button class="btn btn-secondary" onclick='editChampion(${JSON.stringify(c)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('champions','${c.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada champion.</td></tr>';
}
window.editChampion=c=>{editState.champions=c.id;["team_name","rank","event_name","mvp","prize","story","photo"].forEach(k=>document.getElementById("champion_"+k).value=c[k]||"");championSubmit.textContent="Simpan Perubahan";showTab("championsTab")};
makeFormHandler({formId:"championForm",table:"champions",stateKey:"champions",messageId:"championMessage",submitId:"championSubmit",payloadFn:async()=>{
  let photo=champion_photo.value.trim()||null;if(champion_file.files[0])photo=await uploadMedia(champion_file.files[0],"champions");
  return {team_name:champion_team_name.value.trim(),rank:champion_rank.value.trim(),event_name:champion_event_name.value.trim(),mvp:champion_mvp.value.trim(),prize:champion_prize.value.trim(),story:champion_story.value.trim(),photo}
}});

/* news */
async function loadNews(){
  const data=await rows("news","published_at");
  newsRows.innerHTML=data.map(n=>`<tr><td>${esc(n.title)}</td><td>${esc(n.summary||"-")}</td><td>${esc((n.published_at||"").slice(0,10))}</td><td><button class="btn btn-secondary" onclick='editNews(${JSON.stringify(n)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('news','${n.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="5">Belum ada berita.</td></tr>';
}
window.editNews=n=>{editState.news=n.id;["title","slug","summary","content","cover","seo_title","seo_description"].forEach(k=>document.getElementById("news_"+k).value=n[k]||"");newsSubmit.textContent="Simpan Perubahan";showTab("newsTab")};
makeFormHandler({formId:"newsForm",table:"news",stateKey:"news",messageId:"newsMessage",submitId:"newsSubmit",payloadFn:async()=>{
  let cover=news_cover.value.trim()||null;if(news_file.files[0])cover=await uploadMedia(news_file.files[0],"news");
  return {title:news_title.value.trim(),slug:news_slug.value.trim()||slugify(news_title.value),summary:news_summary.value.trim(),content:news_content.value.trim(),cover,seo_title:news_seo_title.value.trim()||null,seo_description:news_seo_description.value.trim()||null,published_at:new Date().toISOString()}
}});

/* gallery */
async function loadGallery(){
  const data=await rows("gallery");
  galleryRows.innerHTML=data.map(g=>`<tr><td>${esc(g.caption||"-")}</td><td>${esc(g.event_name||"-")}</td><td><a href="${esc(g.image_url)}" target="_blank">Lihat</a></td><td><button class="btn btn-secondary" onclick='editGallery(${JSON.stringify(g)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('gallery','${g.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="5">Belum ada galeri.</td></tr>';
}
window.editGallery=g=>{editState.gallery=g.id;["caption","event_name","image_url"].forEach(k=>document.getElementById("gallery_"+k).value=g[k]||"");gallerySubmit.textContent="Simpan Perubahan";showTab("galleryTab")};
makeFormHandler({formId:"galleryForm",table:"gallery",stateKey:"gallery",messageId:"galleryMessage",submitId:"gallerySubmit",payloadFn:async()=>{
  let image_url=gallery_image_url.value.trim()||null;if(gallery_file.files[0])image_url=await uploadMedia(gallery_file.files[0],"gallery");if(!image_url)throw new Error("Gambar wajib diisi.");
  return {caption:gallery_caption.value.trim(),event_name:gallery_event_name.value.trim(),image_url}
}});

/* sponsors */
async function loadSponsors(){
  const data=await rows("sponsors","sort_order",true);
  sponsorRows.innerHTML=data.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.website||"-")}</td><td>${s.logo?`<a href="${esc(s.logo)}" target="_blank">Logo</a>`:"-"}</td><td>${s.sort_order??0}</td><td><button class="btn btn-secondary" onclick='editSponsor(${JSON.stringify(s)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('sponsors','${s.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada sponsor.</td></tr>';
}
window.editSponsor=s=>{editState.sponsors=s.id;["name","website","logo","sort_order"].forEach(k=>document.getElementById("sponsor_"+k).value=s[k]??"");sponsorSubmit.textContent="Simpan Perubahan";showTab("sponsorsTab")};
makeFormHandler({formId:"sponsorForm",table:"sponsors",stateKey:"sponsors",messageId:"sponsorMessage",submitId:"sponsorSubmit",payloadFn:async()=>{
  let logo=sponsor_logo.value.trim()||null;if(sponsor_file.files[0])logo=await uploadMedia(sponsor_file.files[0],"sponsors");
  return {name:sponsor_name.value.trim(),website:sponsor_website.value.trim(),logo,sort_order:Number(sponsor_sort_order.value||0)}
}});

/* settings */
async function loadSettings(){
  const {data}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();if(!data)return;
  ["whatsapp","email","instagram","tiktok","discord","youtube_live_url"].forEach(k=>document.getElementById("settings_"+k).value=data[k]||"");
}
settingsForm.addEventListener("submit",async e=>{
  e.preventDefault();const payload={id:1,whatsapp:settings_whatsapp.value.trim(),email:settings_email.value.trim(),instagram:settings_instagram.value.trim(),tiktok:settings_tiktok.value.trim(),discord:settings_discord.value.trim(),youtube_live_url:settings_youtube_live_url.value.trim(),updated_at:new Date().toISOString()};
  const {error}=await sb.from("site_settings").upsert(payload);if(error){msg(settingsMessage,error.message,"error");return}msg(settingsMessage,"Settings berhasil disimpan.","success");
});
checkSession();


// DOSMOS VIP enhancements
const vipToast = document.createElement("div");
vipToast.className = "vip-toast";
document.body.appendChild(vipToast);

function showVipToast(text,type="success"){
  vipToast.textContent = text;
  vipToast.className = `vip-toast ${type} show`;
  clearTimeout(window.__vipToastTimer);
  window.__vipToastTimer = setTimeout(()=>{
    vipToast.classList.remove("show");
  },2800);
}

document.querySelectorAll("[data-tab-jump]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const id=btn.dataset.tabJump;
    document.querySelector(`[data-tab="${id}"]`)?.click();
    window.scrollTo({top:0,behavior:"smooth"});
  });
});

document.querySelectorAll(".vip-table-search").forEach(input=>{
  input.addEventListener("input",()=>{
    const body=document.getElementById(input.dataset.target);
    const term=input.value.trim().toLowerCase();
    body?.querySelectorAll("tr").forEach(row=>{
      row.style.display=row.textContent.toLowerCase().includes(term)?"":"none";
    });
  });
});

// Convert visible success/error messages into premium toast notifications.
const vipObserver = new MutationObserver(mutations=>{
  for(const mutation of mutations){
    const el=mutation.target;
    if(!(el instanceof HTMLElement))continue;
    const text=el.textContent.trim();
    if(!text)continue;
    if(el.classList.contains("message")){
      const type=el.classList.contains("error")?"error":"success";
      showVipToast(text,type);
    }
  }
});
document.querySelectorAll(".message").forEach(el=>vipObserver.observe(el,{childList:true,subtree:true,characterData:true}));


/* Branding Manager */
let savedBranding = {
  site_name:"DOSMOS",
  slogan:"Every Gamer Deserves a Chance.",
  main_logo_url:"../dosmos-logo.png",
  hero_logo_url:"../dosmos-logo.png",
  favicon_url:"../dosmos-logo.png",
  primary_color:"#f6c744",
  background_color:"#080808",
  hero_background_url:"",
  mobile_hero_background_url:"",
  login_background_url:"",
  footer_background_url:"",
  hero_overlay:65,
  hero_position:"center"
};

const validHex = value => /^#[0-9a-fA-F]{6}$/.test(String(value||"").trim());

function syncBrandColor(colorId,textId){
  const color=document.getElementById(colorId);
  const text=document.getElementById(textId);
  color?.addEventListener("input",()=>{
    text.value=color.value;
    updateBrandingPreview();
  });
  text?.addEventListener("input",()=>{
    if(validHex(text.value)){
      color.value=text.value;
      updateBrandingPreview();
    }
  });
}

function setPreviewImage(input,img){
  const file=input?.files?.[0];
  if(!file)return;
  const url=URL.createObjectURL(file);
  img.src=url;
  img.dataset.objectUrl=url;
}

function cleanupPreviewObjectUrls(){
  ["brandingPreviewLogo","brandingPreviewHero"].forEach(id=>{
    const img=document.getElementById(id);
    if(img?.dataset.objectUrl){
      URL.revokeObjectURL(img.dataset.objectUrl);
      delete img.dataset.objectUrl;
    }
  });
}

function updateBrandingPreview(){
  const name=branding_site_name.value.trim()||"DOSMOS";
  const slogan=branding_slogan.value.trim()||"Every Gamer Deserves a Chance.";
  const primary=validHex(branding_primary_color_text.value)?branding_primary_color_text.value:"#f6c744";
  const background=validHex(branding_background_color_text.value)?branding_background_color_text.value:"#080808";
  const mainUrl=branding_main_logo_url.value.trim()||savedBranding.main_logo_url||"../dosmos-logo.png";
  const heroUrl=branding_hero_logo_url.value.trim()||mainUrl;
  const heroBg=branding_hero_bg_url.value.trim()||savedBranding.hero_background_url||"";
  const overlay=Math.min(95,Math.max(0,Number(branding_hero_overlay.value||65)));
  const heroPosition=branding_hero_position.value||"center";

  brandingPreviewName.textContent=name;
  brandingPreviewHeroName.textContent=name;
  brandingPreviewSlogan.textContent=slogan;
  if(!brandingPreviewLogo.dataset.objectUrl)brandingPreviewLogo.src=mainUrl;
  if(!brandingPreviewHero.dataset.objectUrl)brandingPreviewHero.src=heroUrl;

  const card=document.querySelector(".branding-preview-card");
  card?.style.setProperty("--brand-primary",primary);
  card?.style.setProperty("--brand-background",background);

  const previewArea=document.getElementById("brandingPreviewHeroArea");
  if(previewArea){
    const shade=(overlay/100).toFixed(2);
    previewArea.style.backgroundImage=heroBg
      ? `linear-gradient(rgba(5,5,5,${shade}),rgba(5,5,5,${Math.min(0.98,Number(shade)+0.18)})),url("${heroBg}")`
      : "";
    previewArea.style.backgroundPosition=heroPosition;
    previewArea.style.backgroundSize="cover";
    previewArea.style.backgroundRepeat="no-repeat";
  }
  branding_hero_overlay_value.textContent=`${overlay}%`;
}

function fillBrandingForm(data={}){
  savedBranding={
    site_name:data.site_name||"DOSMOS",
    slogan:data.slogan||"Every Gamer Deserves a Chance.",
    main_logo_url:data.main_logo_url||"../dosmos-logo.png",
    hero_logo_url:data.hero_logo_url||data.main_logo_url||"../dosmos-logo.png",
    favicon_url:data.favicon_url||data.main_logo_url||"../dosmos-logo.png",
    primary_color:validHex(data.primary_color)?data.primary_color:"#f6c744",
    background_color:validHex(data.background_color)?data.background_color:"#080808",
    hero_background_url:data.hero_background_url||"",
    mobile_hero_background_url:data.mobile_hero_background_url||data.hero_background_url||"",
    login_background_url:data.login_background_url||"",
    footer_background_url:data.footer_background_url||"",
    hero_overlay:Number.isFinite(Number(data.hero_overlay))?Number(data.hero_overlay):65,
    hero_position:data.hero_position||"center"
  };

  branding_site_name.value=savedBranding.site_name;
  branding_slogan.value=savedBranding.slogan;
  branding_main_logo_url.value=data.main_logo_url||"";
  branding_hero_logo_url.value=data.hero_logo_url||"";
  branding_favicon_url.value=data.favicon_url||"";
  branding_hero_bg_url.value=data.hero_background_url||"";
  branding_mobile_hero_bg_url.value=data.mobile_hero_background_url||"";
  branding_login_bg_url.value=data.login_background_url||"";
  branding_footer_bg_url.value=data.footer_background_url||"";
  branding_hero_overlay.value=String(savedBranding.hero_overlay);
  branding_hero_position.value=savedBranding.hero_position;
  branding_primary_color.value=savedBranding.primary_color;
  branding_primary_color_text.value=savedBranding.primary_color;
  branding_background_color.value=savedBranding.background_color;
  branding_background_color_text.value=savedBranding.background_color;

  cleanupPreviewObjectUrls();
  brandingPreviewLogo.src=savedBranding.main_logo_url;
  brandingPreviewHero.src=savedBranding.hero_logo_url;
  updateBrandingPreview();
  applyAdminBranding(savedBranding);
}

function applyAdminBranding(data){
  const logo=data.main_logo_url||"../dosmos-logo.png";
  ["loginBrandLogo","mobileBrandLogo","sidebarBrandLogo"].forEach(id=>{
    const img=document.getElementById(id);
    if(img)img.src=logo;
  });
  const sideName=document.getElementById("sidebarSiteName");
  if(sideName)sideName.textContent=data.site_name||"DOSMOS";
  const fav=document.getElementById("adminFavicon");
  if(fav)fav.href=data.favicon_url||logo;
  document.documentElement.style.setProperty("--brand-primary",data.primary_color||"#f6c744");
  document.documentElement.style.setProperty("--brand-background",data.background_color||"#080808");

  const loginBg=data.login_background_url||"";
  document.documentElement.style.setProperty("--login-bg-image",loginBg?`url("${loginBg}")`:"none");
}

async function loadBranding(){
  const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(error)throw error;
  fillBrandingForm(data||{});
}

branding_main_logo_file?.addEventListener("change",()=>{
  cleanupPreviewObjectUrls();
  setPreviewImage(branding_main_logo_file,brandingPreviewLogo);
  if(!branding_hero_logo_file.files[0]&&!branding_hero_logo_url.value.trim()){
    setPreviewImage(branding_main_logo_file,brandingPreviewHero);
  }
  updateBrandingPreview();
});
branding_hero_logo_file?.addEventListener("change",()=>{
  if(brandingPreviewHero.dataset.objectUrl){
    URL.revokeObjectURL(brandingPreviewHero.dataset.objectUrl);
    delete brandingPreviewHero.dataset.objectUrl;
  }
  setPreviewImage(branding_hero_logo_file,brandingPreviewHero);
  updateBrandingPreview();
});
[
  branding_site_name,branding_slogan,branding_main_logo_url,
  branding_hero_logo_url,branding_favicon_url,branding_hero_bg_url,
  branding_mobile_hero_bg_url,branding_login_bg_url,branding_footer_bg_url,
  branding_hero_overlay,branding_hero_position
].forEach(el=>el?.addEventListener("input",updateBrandingPreview));


branding_hero_bg_file?.addEventListener("change",()=>{
  const file=branding_hero_bg_file.files[0];
  if(file){
    branding_hero_bg_url.value=URL.createObjectURL(file);
    branding_hero_bg_url.dataset.objectUrl="1";
  }
  updateBrandingPreview();
});

syncBrandColor("branding_primary_color","branding_primary_color_text");
syncBrandColor("branding_background_color","branding_background_color_text");

brandingResetPreview?.addEventListener("click",()=>fillBrandingForm(savedBranding));

brandingForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  msg(brandingMessage,"Mengunggah dan menyimpan branding...");
  brandingSubmit.disabled=true;

  try{
    let mainLogo=branding_main_logo_url.value.trim()||savedBranding.main_logo_url||null;
    if(branding_main_logo_file.files[0]){
      mainLogo=await uploadMedia(branding_main_logo_file.files[0],"branding/main");
    }

    let heroLogo=branding_hero_logo_url.value.trim()||mainLogo;
    if(branding_hero_logo_file.files[0]){
      heroLogo=await uploadMedia(branding_hero_logo_file.files[0],"branding/hero");
    }

    let favicon=branding_favicon_url.value.trim()||mainLogo;
    if(branding_favicon_file.files[0]){
      favicon=await uploadMedia(branding_favicon_file.files[0],"branding/favicon");
    }

    let heroBackground=branding_hero_bg_url.value.trim()||savedBranding.hero_background_url||null;
    if(branding_hero_bg_file.files[0]){
      heroBackground=await uploadMedia(branding_hero_bg_file.files[0],"branding/backgrounds/hero");
    }

    let mobileHeroBackground=branding_mobile_hero_bg_url.value.trim()||heroBackground||null;
    if(branding_mobile_hero_bg_file.files[0]){
      mobileHeroBackground=await uploadMedia(branding_mobile_hero_bg_file.files[0],"branding/backgrounds/mobile-hero");
    }

    let loginBackground=branding_login_bg_url.value.trim()||savedBranding.login_background_url||null;
    if(branding_login_bg_file.files[0]){
      loginBackground=await uploadMedia(branding_login_bg_file.files[0],"branding/backgrounds/login");
    }

    let footerBackground=branding_footer_bg_url.value.trim()||savedBranding.footer_background_url||null;
    if(branding_footer_bg_file.files[0]){
      footerBackground=await uploadMedia(branding_footer_bg_file.files[0],"branding/backgrounds/footer");
    }

    const primary=branding_primary_color_text.value.trim();
    const background=branding_background_color_text.value.trim();
    if(!validHex(primary)||!validHex(background)){
      throw new Error("Kode warna harus memakai format HEX seperti #f6c744.");
    }

    const payload={
      id:1,
      site_name:branding_site_name.value.trim()||"DOSMOS",
      slogan:branding_slogan.value.trim()||"Every Gamer Deserves a Chance.",
      main_logo_url:mainLogo,
      hero_logo_url:heroLogo,
      favicon_url:favicon,
      primary_color:primary,
      background_color:background,
      hero_background_url:heroBackground,
      mobile_hero_background_url:mobileHeroBackground,
      login_background_url:loginBackground,
      footer_background_url:footerBackground,
      hero_overlay:Number(branding_hero_overlay.value||65),
      hero_position:branding_hero_position.value||"center",
      updated_at:new Date().toISOString()
    };

    const {error}=await sb.from("site_settings").upsert(payload);
    if(error)throw error;

    brandingForm.reset();
    fillBrandingForm(payload);
    msg(brandingMessage,"Branding berhasil disimpan dan langsung aktif di website.","success");
  }catch(err){
    msg(brandingMessage,err.message,"error");
  }finally{
    brandingSubmit.disabled=false;
  }
});


/* Website Content Manager */
const contentDefaults={
  hero_badge:"Official Gaming & Esports Company",
  hero_title:"DOSMOS",
  hero_description:"Every Gamer Deserves a Chance. Gaming, esports, community, content, event, dan business collaboration.",
  hero_primary_button_text:"Lihat Event",
  hero_primary_button_link:"#events",
  hero_secondary_button_text:"Daftar Tim",
  hero_secondary_button_link:"#register",
  events_eyebrow:"Current & Upcoming",
  events_title:"DOSMOS Events",
  register_eyebrow:"Team Registration",
  register_title:"Daftar Turnamen DOSMOS",
  bracket_eyebrow:"Tournament Progress",
  bracket_title:"Bracket & Match Results",
  live_eyebrow:"Live Broadcast",
  live_title:"Watch DOSMOS Live",
  champions_eyebrow:"Hall of Champions",
  champions_title:"Every Victory Has a Story.",
  news_eyebrow:"Latest Update",
  news_title:"DOSMOS News",
  gallery_eyebrow:"Moments",
  gallery_title:"Gallery",
  partners_eyebrow:"Partnership",
  partners_title:"Partners & Sponsors",
  contact_eyebrow:"Business Contact",
  contact_title:"Let’s Build Something Together.",
  partnership_title:"Partnership Business",
  partnership_description:"Tertarik bekerja sama dengan DOSMOS untuk event, sponsorship, komunitas, media, atau kolaborasi bisnis? Hubungi kami langsung melalui WhatsApp.",
  partnership_button_text:"Hubungi via WhatsApp"
};

const contentKeys=Object.keys(contentDefaults);

async function loadWebsiteContent(){
  const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(error)throw error;
  contentKeys.forEach(key=>{
    const input=document.getElementById("content_"+key);
    if(input)input.value=data?.[key]||contentDefaults[key];
  });
}

contentForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  msg(contentMessage,"Menyimpan kata-kata website...");
  contentSubmit.disabled=true;
  try{
    const payload={id:1,updated_at:new Date().toISOString()};
    contentKeys.forEach(key=>{
      const input=document.getElementById("content_"+key);
      payload[key]=input?.value.trim()||contentDefaults[key];
    });
    const {error}=await sb.from("site_settings").upsert(payload);
    if(error)throw error;
    msg(contentMessage,"Kata-kata website berhasil disimpan dan langsung aktif.","success");
  }catch(err){
    msg(contentMessage,err.message,"error");
  }finally{
    contentSubmit.disabled=false;
  }
});


/* DOSMOS VIP V14.3 — LIVE CENTER */
const liveDefaults={live_status:"offline",live_platform:"youtube",live_stream_title:"DOSMOS Live",live_channel_name:"DOSMOS Official",live_description:"Saksikan siaran langsung dan pertandingan terbaru dari DOSMOS.",live_stream_url:"",live_embed_url:"",live_watch_url:"",live_button_text:"WATCH NOW",live_thumbnail_url:"",live_viewer_text:"",live_start_at:"",live_offline_text:"Live berikutnya segera hadir.",live_show_countdown:true};
const liveKeys=Object.keys(liveDefaults);
function setLivePreview(){const s=live_status.value||"offline";livePreviewStatus.textContent=s==="live"?"LIVE NOW":s==="coming_soon"?"COMING SOON":"OFFLINE";livePreviewStatus.className="live-admin-preview-badge "+s;livePreviewTitle.textContent=live_stream_title.value.trim()||"DOSMOS Live";livePreviewPlatform.textContent=live_platform.options[live_platform.selectedIndex]?.text||"YouTube";}
async function loadLiveCenter(){const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();if(error)throw error;liveKeys.forEach(key=>{const el=document.getElementById(key);if(!el)return;let value=data?.[key];if(value===null||value===undefined||value==="")value=liveDefaults[key];if(key==="live_show_countdown")value=String(value)!=="false"?"true":"false";if(key==="live_start_at"&&value){const d=new Date(value);if(!Number.isNaN(d.getTime())){const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);value=local.toISOString().slice(0,16);}}el.value=String(value??"");});setLivePreview();}
[live_status,live_platform,live_stream_title,live_channel_name,live_description,live_stream_url,live_embed_url,live_watch_url,live_button_text,live_thumbnail_url,live_viewer_text,live_start_at,live_offline_text,live_show_countdown].forEach(el=>el?.addEventListener("input",setLivePreview));
liveCenterForm?.addEventListener("submit",async e=>{e.preventDefault();msg(liveCenterMessage,"Menyimpan Live Center...");liveCenterSubmit.disabled=true;try{let thumbnail=live_thumbnail_url.value.trim()||null;if(live_thumbnail_file.files[0])thumbnail=await uploadMedia(live_thumbnail_file.files[0],"live-center/thumbnails");let startAt=null;if(live_start_at.value){const d=new Date(live_start_at.value);if(!Number.isNaN(d.getTime()))startAt=d.toISOString();}const payload={id:1,live_status:live_status.value,live_platform:live_platform.value,live_stream_title:live_stream_title.value.trim()||liveDefaults.live_stream_title,live_channel_name:live_channel_name.value.trim()||liveDefaults.live_channel_name,live_description:live_description.value.trim()||liveDefaults.live_description,live_stream_url:live_stream_url.value.trim()||null,live_embed_url:live_embed_url.value.trim()||null,live_watch_url:live_watch_url.value.trim()||live_stream_url.value.trim()||null,live_button_text:live_button_text.value.trim()||"WATCH NOW",live_thumbnail_url:thumbnail,live_viewer_text:live_viewer_text.value.trim()||null,live_start_at:startAt,live_offline_text:live_offline_text.value.trim()||liveDefaults.live_offline_text,live_show_countdown:live_show_countdown.value==="true",youtube_live_url:live_platform.value==="youtube"?live_stream_url.value.trim()||null:null,updated_at:new Date().toISOString()};const {error}=await sb.from("site_settings").upsert(payload);if(error)throw error;live_thumbnail_url.value=thumbnail||"";msg(liveCenterMessage,"Live Center berhasil disimpan dan langsung aktif.","success");setLivePreview();}catch(err){msg(liveCenterMessage,err.message,"error");}finally{liveCenterSubmit.disabled=false;}});


/* DOSMOS VIP V14.4 — ANNOUNCEMENT CENTER */
let announcementCache=[];

function announcementToLocalInput(value){
  if(!value)return "";
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return "";
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}

function announcementToIso(value){
  if(!value)return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d.toISOString();
}

function setAnnouncementPreview(){
  const badge=announcement_badge.value||"";
  announcementPreviewBadge.textContent=badge||"INFO";
  announcementPreviewBadge.style.display=badge?"inline-flex":"none";
  announcementPreviewTitle.textContent=announcement_title.value.trim()||"Judul Pengumuman";
  announcementPreviewMessage.textContent=announcement_message.value.trim()||"Preview pengumuman akan tampil di sini.";
  announcementPreviewButton.textContent=announcement_button_text.value.trim()||"JOIN NOW";
  announcementPreviewButton.style.display=announcement_button_text.value.trim()?"inline-flex":"none";
  announcementPreview.className=`form-full announcement-preview-box theme-${announcement_theme.value} anim-${announcement_animation.value}`;
}

function resetAnnouncementForm(){
  announcement_id.value="";
  announcementForm.reset();
  announcement_priority.value="10";
  announcement_auto_hide.value="0";
  announcement_status.value="draft";
  announcement_type.value="topbar";
  announcement_theme.value="gold";
  announcement_animation.value="fade";
  announcement_dismissible.value="true";
  announcement_emergency.value="false";
  setAnnouncementPreview();
}

async function loadAnnouncements(){
  const {data,error}=await sb.from("announcements").select("*").order("priority",{ascending:false}).order("created_at",{ascending:false});
  if(error)throw error;
  announcementCache=data||[];
  renderAnnouncementAdminList();
}

function renderAnnouncementAdminList(){
  if(!announcementCache.length){
    announcementList.innerHTML='<div class="empty-state">Belum ada pengumuman.</div>';
    return;
  }
  announcementList.innerHTML=announcementCache.map(item=>{
    const start=item.start_at?new Date(item.start_at).toLocaleString():"Langsung";
    const end=item.end_at?new Date(item.end_at).toLocaleString():"Tanpa batas";
    return `<article class="announcement-admin-card">
      <div>
        <div class="announcement-admin-meta">
          <span>${item.badge||"INFO"}</span>
          <span>${item.type}</span>
          <span>${item.status}</span>
          ${item.emergency?'<span>EMERGENCY</span>':""}
        </div>
        <h4>${escapeHtml(item.title||"Tanpa Judul")}</h4>
        <p>${escapeHtml(item.message||"")}</p>
        <small>${start} — ${end} · Priority ${item.priority||0}</small>
      </div>
      <div class="announcement-admin-buttons">
        <button class="btn btn-secondary" type="button" data-ann-edit="${item.id}">Edit</button>
        <button class="btn btn-secondary" type="button" data-ann-toggle="${item.id}">${item.status==="published"?"Jadikan Draft":"Publish"}</button>
        <button class="btn btn-danger" type="button" data-ann-delete="${item.id}">Hapus</button>
      </div>
    </article>`;
  }).join("");
}

announcementList?.addEventListener("click",async e=>{
  const edit=e.target.closest("[data-ann-edit]");
  const toggle=e.target.closest("[data-ann-toggle]");
  const del=e.target.closest("[data-ann-delete]");

  if(edit){
    const item=announcementCache.find(x=>String(x.id)===String(edit.dataset.annEdit));
    if(!item)return;
    announcement_id.value=item.id;
    announcement_title.value=item.title||"";
    announcement_message.value=item.message||"";
    announcement_badge.value=item.badge||"";
    announcement_type.value=item.type||"topbar";
    announcement_status.value=item.status||"draft";
    announcement_theme.value=item.theme||"gold";
    announcement_animation.value=item.animation||"fade";
    announcement_button_text.value=item.button_text||"";
    announcement_button_url.value=item.button_url||"";
    announcement_priority.value=item.priority??10;
    announcement_auto_hide.value=item.auto_hide_seconds??0;
    announcement_start_at.value=announcementToLocalInput(item.start_at);
    announcement_end_at.value=announcementToLocalInput(item.end_at);
    announcement_dismissible.value=String(item.dismissible)!=="false"?"true":"false";
    announcement_emergency.value=String(item.emergency)==="true"?"true":"false";
    setAnnouncementPreview();
    document.querySelector('[data-tab="announcementTab"]')?.click();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  if(toggle){
    const item=announcementCache.find(x=>String(x.id)===String(toggle.dataset.annToggle));
    if(!item)return;
    const {error}=await sb.from("announcements").update({
      status:item.status==="published"?"draft":"published",
      updated_at:new Date().toISOString()
    }).eq("id",item.id);
    if(error)return alert(error.message);
    await loadAnnouncements();
  }

  if(del){
    if(!confirm("Hapus pengumuman ini?"))return;
    const {error}=await sb.from("announcements").delete().eq("id",del.dataset.annDelete);
    if(error)return alert(error.message);
    await loadAnnouncements();
  }
});

announcementForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  msg(announcementMessage,"Menyimpan pengumuman...");
  announcementSubmit.disabled=true;
  try{
    const payload={
      title:announcement_title.value.trim(),
      message:announcement_message.value.trim(),
      badge:announcement_badge.value||null,
      type:announcement_type.value,
      status:announcement_status.value,
      theme:announcement_theme.value,
      animation:announcement_animation.value,
      button_text:announcement_button_text.value.trim()||null,
      button_url:announcement_button_url.value.trim()||null,
      priority:Number(announcement_priority.value||0),
      auto_hide_seconds:Number(announcement_auto_hide.value||0),
      start_at:announcementToIso(announcement_start_at.value),
      end_at:announcementToIso(announcement_end_at.value),
      dismissible:announcement_dismissible.value==="true",
      emergency:announcement_emergency.value==="true",
      updated_at:new Date().toISOString()
    };
    if(!payload.title||!payload.message)throw new Error("Judul dan isi pengumuman wajib diisi.");

    let error;
    if(announcement_id.value){
      ({error}=await sb.from("announcements").update(payload).eq("id",announcement_id.value));
    }else{
      ({error}=await sb.from("announcements").insert(payload));
    }
    if(error)throw error;

    msg(announcementMessage,"Pengumuman berhasil disimpan.","success");
    resetAnnouncementForm();
    await loadAnnouncements();
  }catch(err){
    msg(announcementMessage,err.message,"error");
  }finally{
    announcementSubmit.disabled=false;
  }
});

[
  announcement_title,announcement_message,announcement_badge,announcement_type,
  announcement_theme,announcement_animation,announcement_button_text
].forEach(el=>el?.addEventListener("input",setAnnouncementPreview));

announcementReset?.addEventListener("click",resetAnnouncementForm);
announcementRefresh?.addEventListener("click",loadAnnouncements);


/* =========================================================
   DOSMOS VIP V14.5 — TOURNAMENT BRACKET CENTER
   Single elimination 4 / 8 / 16 / 32 teams
========================================================= */
let tournamentBracketCache=[];
let activeAdminBracketId=null;

function bracketEsc(value){return esc(value);}
function bracketRoundName(round,totalRounds){
  if(round===totalRounds)return "GRAND FINAL";
  if(round===totalRounds-1)return "SEMIFINAL";
  if(round===totalRounds-2)return "QUARTER FINAL";
  return `ROUND ${round}`;
}
function parseBracketTeams(text,size){
  const teams=String(text||"").split("\n").map(line=>line.trim()).filter(Boolean).slice(0,size).map((line,index)=>{
    const parts=line.split("|");
    return {name:(parts[0]||"").trim()||`Team ${index+1}`,logo:(parts[1]||"").trim()||null,seed:index+1};
  });
  while(teams.length<size)teams.push({name:"BYE",logo:null,seed:teams.length+1});
  return teams;
}
function seededOrder(size){
  let order=[1,2];
  while(order.length<size){
    const next=order.length*2+1;
    order=order.flatMap(seed=>[seed,next-seed]);
  }
  return order;
}
function shuffleArray(items){
  const arr=[...items];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
async function loadBracketEventOptions(){
  try{
    const events=await rows("events","start_date",false);
    const current=bracket_event_id?.value||"";
    bracket_event_id.innerHTML='<option value="">Tanpa event</option>'+events.map(e=>`<option value="${e.id}">${bracketEsc(e.title)}</option>`).join("");
    bracket_event_id.value=current;
  }catch(err){console.warn(err.message)}
}
async function loadTournamentBrackets(){
  const {data,error}=await sb.from("brackets").select("*, events(title)").order("created_at",{ascending:false});
  if(error)throw error;
  tournamentBracketCache=data||[];
  renderTournamentBracketList();
  renderTournamentBracketSelect();
  await loadBracketEventOptions();
}
function renderTournamentBracketSelect(){
  const current=String(bracketAdminSelect?.value||activeAdminBracketId||"");
  bracketAdminSelect.innerHTML='<option value="">Pilih bracket...</option>'+tournamentBracketCache.map(b=>`<option value="${b.id}">${bracketEsc(b.name)} · ${b.size} Tim</option>`).join("");
  if(tournamentBracketCache.some(b=>String(b.id)===current))bracketAdminSelect.value=current;
}
function renderTournamentBracketList(){
  if(!bracketAdminList)return;
  if(!tournamentBracketCache.length){
    bracketAdminList.innerHTML='<div class="empty-state">Belum ada bracket.</div>';
    return;
  }
  bracketAdminList.innerHTML=tournamentBracketCache.map(b=>`
    <article class="announcement-admin-card">
      <div>
        <div class="announcement-admin-meta">
          <span>${String(b.status||"draft").toUpperCase()}</span>
          <span>${b.size} TIM</span>
          <span>BO${b.best_of||3}</span>
          <span>SINGLE ELIMINATION</span>
        </div>
        <h4>${bracketEsc(b.name)}</h4>
        <p>${bracketEsc(b.events?.title||"Independent Tournament")}</p>
        <small>Dibuat ${new Date(b.created_at).toLocaleString()}</small>
      </div>
      <div class="announcement-admin-buttons">
        <button class="btn btn-secondary" type="button" data-bracket-open="${b.id}">Kelola</button>
        <button class="btn btn-secondary" type="button" data-bracket-publish="${b.id}">${b.status==="published"?"Jadikan Draft":"Publish"}</button>
        <button class="btn btn-danger" type="button" data-bracket-delete="${b.id}">Hapus</button>
      </div>
    </article>`).join("");
}
async function createBracketMatches(bracket,teams){
  const size=Number(bracket.size);
  const totalRounds=Math.log2(size);
  const order=seededOrder(size);
  const teamBySeed=Object.fromEntries(teams.map(t=>[t.seed,t]));
  const ordered=order.map(seed=>teamBySeed[seed]);
  const matches=[];
  let previousRoundIds=[];

  for(let round=1;round<=totalRounds;round++){
    const matchCount=size/Math.pow(2,round);
    const thisRoundIds=[];
    for(let position=1;position<=matchCount;position++){
      const tempId=`r${round}m${position}`;
      thisRoundIds.push(tempId);
      let teamA=null,teamB=null;
      if(round===1){
        teamA=ordered[(position-1)*2];
        teamB=ordered[(position-1)*2+1];
      }
      matches.push({
        _temp_id:tempId,
        bracket_id:bracket.id,
        round_number:round,
        round_name:bracketRoundName(round,totalRounds),
        position,
        team_a_name:teamA?.name||null,
        team_a_logo:teamA?.logo||null,
        team_a_seed:teamA?.seed||null,
        team_b_name:teamB?.name||null,
        team_b_logo:teamB?.logo||null,
        team_b_seed:teamB?.seed||null,
        score_a:null,
        score_b:null,
        winner_name:null,
        winner_logo:null,
        winner_slot:null,
        status:"upcoming",
        best_of:bracket.best_of,
        source_match_a:round===1?null:previousRoundIds[(position-1)*2],
        source_match_b:round===1?null:previousRoundIds[(position-1)*2+1]
      });
    }
    previousRoundIds=thisRoundIds;
  }

  const tempToReal={};
  for(const match of matches){
    const payload={...match};
    delete payload._temp_id;
    payload.source_match_a=payload.source_match_a?tempToReal[payload.source_match_a]:null;
    payload.source_match_b=payload.source_match_b?tempToReal[payload.source_match_b]:null;
    const {data,error}=await sb.from("bracket_matches").insert(payload).select().single();
    if(error)throw error;
    tempToReal[match._temp_id]=data.id;
  }

  await resolveAllByes(bracket.id);
}
async function resolveAllByes(bracketId){
  let changed=true;
  let guard=0;
  while(changed&&guard<10){
    changed=false;guard++;
    const {data,error}=await sb.from("bracket_matches").select("*").eq("bracket_id",bracketId).order("round_number").order("position");
    if(error)throw error;
    for(const match of data||[]){
      if(match.winner_name)continue;
      const a=match.team_a_name,b=match.team_b_name;
      if(a&&b){
        if(a==="BYE"&&b!=="BYE"){
          await completeBracketMatch(match,b,match.team_b_logo,"b",0,1,true);changed=true;
        }else if(b==="BYE"&&a!=="BYE"){
          await completeBracketMatch(match,a,match.team_a_logo,"a",1,0,true);changed=true;
        }else if(a==="BYE"&&b==="BYE"){
          await completeBracketMatch(match,"BYE",null,"a",0,0,true);changed=true;
        }
      }
    }
  }
}
async function completeBracketMatch(match,winnerName,winnerLogo,winnerSlot,scoreA,scoreB,isBye=false){
  const status=isBye?"bye":"finished";
  const {error}=await sb.from("bracket_matches").update({
    score_a:scoreA,score_b:scoreB,winner_name:winnerName,winner_logo:winnerLogo||null,
    winner_slot:winnerSlot,status,updated_at:new Date().toISOString()
  }).eq("id",match.id);
  if(error)throw error;

  const {data:nextMatches,error:nextError}=await sb.from("bracket_matches")
    .select("*").eq("bracket_id",match.bracket_id)
    .or(`source_match_a.eq.${match.id},source_match_b.eq.${match.id}`);
  if(nextError)throw nextError;

  for(const next of nextMatches||[]){
    const update=next.source_match_a===match.id
      ?{team_a_name:winnerName,team_a_logo:winnerLogo||null,team_a_seed:null}
      :{team_b_name:winnerName,team_b_logo:winnerLogo||null,team_b_seed:null};
    update.updated_at=new Date().toISOString();
    const {error:updateError}=await sb.from("bracket_matches").update(update).eq("id",next.id);
    if(updateError)throw updateError;
  }
}
bracketCreateForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  msg(bracketCreateMessage,"Membuat bracket bercabang...");
  bracketGenerateBtn.disabled=true;
  try{
    const size=Number(bracket_size.value);
    let teams=parseBracketTeams(bracket_teams.value,size);
    if(bracket_seed_mode.value==="random"){
      const real=shuffleArray(teams.filter(t=>t.name!=="BYE"));
      teams=real.map((t,i)=>({...t,seed:i+1}));
      while(teams.length<size)teams.push({name:"BYE",logo:null,seed:teams.length+1});
    }
    const payload={
      name:bracket_name.value.trim(),
      event_id:bracket_event_id.value||null,
      format:"single_elimination",
      size,
      best_of:Number(bracket_best_of.value),
      status:bracket_status.value,
      champion_name:null,
      champion_logo:null,
      updated_at:new Date().toISOString()
    };
    if(!payload.name)throw new Error("Nama bracket wajib diisi.");
    const realTeamCount=teams.filter(t=>t.name!=="BYE").length;
    if(realTeamCount<2)throw new Error("Minimal masukkan 2 tim.");

    const {data:bracket,error}=await sb.from("brackets").insert(payload).select().single();
    if(error)throw error;
    try{
      await createBracketMatches(bracket,teams);
    }catch(matchError){
      await sb.from("brackets").delete().eq("id",bracket.id);
      throw matchError;
    }
    msg(bracketCreateMessage,"Bracket berhasil dibuat.","success");
    bracketCreateForm.reset();
    bracket_size.value="8"; bracket_best_of.value="3"; bracket_status.value="draft";
    await loadTournamentBrackets();
    bracketAdminSelect.value=bracket.id;
    await openAdminBracket(bracket.id);
  }catch(err){
    msg(bracketCreateMessage,err.message,"error");
  }finally{
    bracketGenerateBtn.disabled=false;
  }
});
async function openAdminBracket(id){
  if(!id){
    activeAdminBracketId=null;
    bracketAdminSummary.innerHTML="";
    bracketAdminBoard.innerHTML='<div class="empty-state">Pilih bracket untuk mengelola skor.</div>';
    return;
  }
  activeAdminBracketId=String(id);
  const bracket=tournamentBracketCache.find(b=>String(b.id)===String(id));
  const {data:matches,error}=await sb.from("bracket_matches").select("*").eq("bracket_id",id).order("round_number").order("position");
  if(error)throw error;
  renderAdminBracket(bracket,matches||[]);
}
function adminTeamRow(match,slot){
  const name=slot==="a"?match.team_a_name:match.team_b_name;
  const logo=slot==="a"?match.team_a_logo:match.team_b_logo;
  const score=slot==="a"?match.score_a:match.score_b;
  const winner=match.winner_slot===slot;
  return `<div class="bracket-admin-team ${winner?"is-winner":""}">
    <div class="bracket-team-identity">
      ${logo?`<img src="${bracketEsc(logo)}" alt="">`:'<span class="bracket-team-fallback">D</span>'}
      <span>${bracketEsc(name||"TBD")}</span>
    </div>
    <input type="number" min="0" value="${score??""}" data-score="${slot}" ${!name||name==="BYE"?'disabled':""}>
  </div>`;
}
function renderAdminBracket(bracket,matches){
  if(!bracket){
    bracketAdminBoard.innerHTML='<div class="empty-state">Bracket tidak ditemukan.</div>';return;
  }
  const groups={};
  matches.forEach(m=>(groups[m.round_number]??=[]).push(m));
  const finished=matches.filter(m=>["finished","bye"].includes(m.status)).length;
  bracketAdminSummary.innerHTML=`
    <div><strong>${bracketEsc(bracket.name)}</strong><span>${bracket.events?.title?bracketEsc(bracket.events.title):"Independent Tournament"}</span></div>
    <div class="bracket-summary-pills"><span>${bracket.size} Teams</span><span>BO${bracket.best_of}</span><span>${finished}/${matches.length} Complete</span><span>${String(bracket.status).toUpperCase()}</span></div>`;
  bracketAdminBoard.innerHTML=`<div class="bracket-admin-scroll"><div class="bracket-admin-rounds">${
    Object.entries(groups).map(([round,roundMatches])=>`
      <section class="bracket-admin-round">
        <h4>${bracketEsc(roundMatches[0]?.round_name||`Round ${round}`)}</h4>
        <div class="bracket-admin-round-stack">
          ${roundMatches.map(m=>`
            <article class="bracket-admin-match" data-admin-match="${m.id}">
              <div class="bracket-admin-match-meta">
                <span>Match ${m.position}</span>
                <select data-match-status>
                  <option value="upcoming" ${m.status==="upcoming"?"selected":""}>Upcoming</option>
                  <option value="live" ${m.status==="live"?"selected":""}>Live</option>
                  <option value="finished" ${m.status==="finished"?"selected":""}>Finished</option>
                  <option value="bye" ${m.status==="bye"?"selected":""}>Bye</option>
                </select>
              </div>
              ${adminTeamRow(m,"a")}
              ${adminTeamRow(m,"b")}
              <label class="bracket-match-time">Jadwal
                <input type="datetime-local" data-match-time value="${m.scheduled_at?announcementToLocalInput(m.scheduled_at):""}">
              </label>
              <button class="btn btn-primary bracket-save-result" type="button" data-save-match="${m.id}" ${(!m.team_a_name||!m.team_b_name)?"disabled":""}>Save Result</button>
            </article>`).join("")}
        </div>
      </section>`).join("")
  }</div></div>`;
}
bracketAdminSelect?.addEventListener("change",()=>openAdminBracket(bracketAdminSelect.value));
bracketAdminRefresh?.addEventListener("click",async()=>{await loadTournamentBrackets();if(activeAdminBracketId)await openAdminBracket(activeAdminBracketId)});
bracketAdminList?.addEventListener("click",async e=>{
  const open=e.target.closest("[data-bracket-open]");
  const publish=e.target.closest("[data-bracket-publish]");
  const del=e.target.closest("[data-bracket-delete]");
  if(open){
    bracketAdminSelect.value=open.dataset.bracketOpen;
    await openAdminBracket(open.dataset.bracketOpen);
    document.querySelector('[data-tab="matchesTab"]')?.click();
  }
  if(publish){
    const b=tournamentBracketCache.find(x=>String(x.id)===publish.dataset.bracketPublish);
    if(!b)return;
    const status=b.status==="published"?"draft":"published";
    const {error}=await sb.from("brackets").update({status,updated_at:new Date().toISOString()}).eq("id",b.id);
    if(error)return alert(error.message);
    await loadTournamentBrackets();
  }
  if(del){
    if(!confirm("Hapus bracket beserta seluruh match?"))return;
    const {error}=await sb.from("brackets").delete().eq("id",del.dataset.bracketDelete);
    if(error)return alert(error.message);
    if(String(activeAdminBracketId)===del.dataset.bracketDelete)await openAdminBracket(null);
    await loadTournamentBrackets();
  }
});
bracketAdminBoard?.addEventListener("click",async e=>{
  const button=e.target.closest("[data-save-match]");
  if(!button)return;
  const card=button.closest("[data-admin-match]");
  button.disabled=true;
  try{
    const id=button.dataset.saveMatch;
    const {data:match,error}=await sb.from("bracket_matches").select("*").eq("id",id).single();
    if(error)throw error;
    const scoreA=Number(card.querySelector('[data-score="a"]').value);
    const scoreB=Number(card.querySelector('[data-score="b"]').value);
    const status=card.querySelector("[data-match-status]").value;
    const scheduledAt=announcementToIso(card.querySelector("[data-match-time]").value);
    if(status==="finished"&&scoreA===scoreB)throw new Error("Skor tidak boleh seri saat match selesai.");

    if(status==="finished"){
      const slot=scoreA>scoreB?"a":"b";
      const winnerName=slot==="a"?match.team_a_name:match.team_b_name;
      const winnerLogo=slot==="a"?match.team_a_logo:match.team_b_logo;
      await completeBracketMatch(match,winnerName,winnerLogo,slot,scoreA,scoreB,false);

      const bracket=tournamentBracketCache.find(b=>String(b.id)===String(match.bracket_id));
      const totalRounds=Math.log2(Number(bracket.size));
      if(Number(match.round_number)===totalRounds){
        await sb.from("brackets").update({
          champion_name:winnerName,champion_logo:winnerLogo||null,status:"finished",
          updated_at:new Date().toISOString()
        }).eq("id",match.bracket_id);
      }
    }else{
      const {error:updateError}=await sb.from("bracket_matches").update({
        score_a:Number.isFinite(scoreA)?scoreA:null,score_b:Number.isFinite(scoreB)?scoreB:null,
        status,scheduled_at:scheduledAt,updated_at:new Date().toISOString()
      }).eq("id",id);
      if(updateError)throw updateError;
    }
    await loadTournamentBrackets();
    await openAdminBracket(match.bracket_id);
  }catch(err){
    alert(err.message);
  }finally{
    button.disabled=false;
  }
});


/* =========================================================
   DOSMOS VIP V14.6 — MEDIA LIBRARY PRO
========================================================= */
let mediaLibraryCache=[];

function formatMediaBytes(bytes){
  const value=Number(bytes||0);
  if(value<1024)return `${value} B`;
  if(value<1024*1024)return `${(value/1024).toFixed(1)} KB`;
  if(value<1024*1024*1024)return `${(value/1024/1024).toFixed(1)} MB`;
  return `${(value/1024/1024/1024).toFixed(2)} GB`;
}
function mediaStatusLabel(status){
  return status==="active"?"ACTIVE":status==="hidden"?"HIDDEN":"ARCHIVE";
}
async function loadMediaLibrary(){
  const {data,error}=await sb.from("media_assets").select("*").order("created_at",{ascending:false});
  if(error){
    if(mediaLibraryGrid)mediaLibraryGrid.innerHTML=`<div class="empty-state">Media Library belum siap: ${esc(error.message)}</div>`;
    return;
  }
  mediaLibraryCache=data||[];
  renderMediaStats();
  renderMediaLibrary();
}
function renderMediaStats(){
  if(!mediaStatTotal)return;
  mediaStatTotal.textContent=mediaLibraryCache.length;
  mediaStatActive.textContent=mediaLibraryCache.filter(x=>x.status==="active").length;
  mediaStatHidden.textContent=mediaLibraryCache.filter(x=>x.status==="hidden").length;
  mediaStatArchive.textContent=mediaLibraryCache.filter(x=>x.status==="archive").length;
  mediaStatStorage.textContent=formatMediaBytes(mediaLibraryCache.reduce((sum,x)=>sum+Number(x.file_size||0),0));
}
function filteredMediaAssets(){
  const search=(mediaSearch?.value||"").trim().toLowerCase();
  const category=mediaCategoryFilter?.value||"all";
  const status=mediaStatusFilter?.value||"all";
  const sort=mediaSort?.value||"newest";
  let assets=mediaLibraryCache.filter(asset=>{
    const matchSearch=!search||`${asset.display_name||""} ${asset.original_name||""}`.toLowerCase().includes(search);
    const matchCategory=category==="all"||asset.category===category;
    const matchStatus=status==="all"||asset.status===status;
    return matchSearch&&matchCategory&&matchStatus;
  });
  assets.sort((a,b)=>{
    if(sort==="oldest")return new Date(a.created_at)-new Date(b.created_at);
    if(sort==="name")return String(a.display_name||a.original_name).localeCompare(String(b.display_name||b.original_name));
    if(sort==="size")return Number(b.file_size||0)-Number(a.file_size||0);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  return assets;
}
function renderMediaLibrary(){
  if(!mediaLibraryGrid)return;
  const assets=filteredMediaAssets();
  if(!assets.length){
    mediaLibraryGrid.innerHTML='<div class="empty-state media-grid-empty">Tidak ada media yang cocok.</div>';
    return;
  }
  mediaLibraryGrid.innerHTML=assets.map(asset=>`
    <article class="media-card status-${asset.status}" data-media-id="${asset.id}">
      <div class="media-card-image">
        <img src="${esc(asset.public_url)}" alt="${esc(asset.display_name||asset.original_name)}" loading="lazy">
        <span class="media-status-badge">${mediaStatusLabel(asset.status)}</span>
      </div>
      <div class="media-card-body">
        <h4 title="${esc(asset.display_name||asset.original_name)}">${esc(asset.display_name||asset.original_name)}</h4>
        <div class="media-card-meta">
          <span>${esc(String(asset.category||"other").toUpperCase())}</span>
          <span>${formatMediaBytes(asset.file_size)}</span>
        </div>
        <small title="${esc(asset.original_name)}">${esc(asset.original_name||"Media")}</small>
        <div class="media-card-actions">
          <button class="btn btn-primary" type="button" data-media-use="${asset.id}">Gunakan</button>
          <button class="btn btn-secondary" type="button" data-media-copy="${asset.id}">Copy URL</button>
          <button class="btn btn-secondary" type="button" data-media-rename="${asset.id}">Rename</button>
        </div>
        <div class="media-status-actions">
          <button type="button" data-media-status="active" data-id="${asset.id}" class="${asset.status==="active"?"current":""}">Active</button>
          <button type="button" data-media-status="hidden" data-id="${asset.id}" class="${asset.status==="hidden"?"current":""}">Hidden</button>
          <button type="button" data-media-status="archive" data-id="${asset.id}" class="${asset.status==="archive"?"current":""}">Archive</button>
          <button type="button" class="media-delete-action" data-media-delete="${asset.id}">Delete</button>
        </div>
      </div>
    </article>`).join("");
}
async function findMediaUsage(url){
  const usages=[];
  const checks=[
    ["site_settings",["main_logo_url","hero_logo_url","favicon_url","hero_background_url","mobile_hero_background_url","login_background_url","footer_background_url","live_thumbnail_url"],"Website Settings"],
    ["events",["banner"],"Event"],
    ["champions",["photo"],"Champion"],
    ["news",["cover"],"News"],
    ["gallery",["image_url"],"Gallery"],
    ["sponsors",["logo"],"Sponsor"],
    ["bracket_matches",["team_a_logo","team_b_logo","winner_logo"],"Bracket Match"],
    ["brackets",["champion_logo"],"Bracket Champion"]
  ];
  for(const [table,columns,label] of checks){
    for(const column of columns){
      const {data,error}=await sb.from(table).select("id").eq(column,url).limit(3);
      if(!error&&data?.length)usages.push(`${label} (${column})`);
    }
  }
  return [...new Set(usages)];
}
async function updateMediaStatus(id,status){
  const {error}=await sb.from("media_assets").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)throw error;
  await loadMediaLibrary();
}
async function deleteMediaAsset(asset){
  const usages=await findMediaUsage(asset.public_url);
  if(usages.length){
    alert(`Gambar ini masih dipakai oleh:\n\n${usages.join("\n")}\n\nUbah gambar pada modul tersebut atau jadikan Hidden/Archive. File tidak dihapus.`);
    return;
  }
  if(!confirm(`Hapus permanen "${asset.display_name||asset.original_name}" dari database dan storage?`))return;
  if(asset.storage_path){
    const {error:storageError}=await sb.storage.from(cfg.storageBucket).remove([asset.storage_path]);
    if(storageError)throw storageError;
  }
  const {error}=await sb.from("media_assets").delete().eq("id",asset.id);
  if(error)throw error;
  await loadMediaLibrary();
}
async function copyMediaUrl(url){
  try{
    await navigator.clipboard.writeText(url);
  }catch{
    const area=document.createElement("textarea");
    area.value=url;document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();
  }
}
function useMediaAsset(asset){
  const targetValue=mediaPickerTarget?.value||"";
  if(!targetValue){
    copyMediaUrl(asset.public_url);
    alert("URL gambar sudah dicopy.");
    return;
  }
  const [fieldId,tabId]=targetValue.split("|");
  const field=document.getElementById(fieldId);
  if(!field){
    alert("Target field tidak ditemukan.");return;
  }
  field.value=asset.public_url;
  field.dispatchEvent(new Event("input",{bubbles:true}));
  field.dispatchEvent(new Event("change",{bubbles:true}));
  showTab(tabId);
  field.scrollIntoView({behavior:"smooth",block:"center"});
  field.focus();
}
mediaUploadForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  msg(mediaUploadMessage,"Mengunggah media...");
  mediaUploadSubmit.disabled=true;
  try{
    const file=media_upload_file.files[0];
    if(!file)throw new Error("Pilih gambar terlebih dahulu.");
    const category=media_category.value;
    await uploadMedia(file,`library/${category}`,{
      category,
      status:media_initial_status.value,
      displayName:media_display_name.value.trim()||file.name
    });
    mediaUploadForm.reset();
    media_initial_status.value="active";
    msg(mediaUploadMessage,"Media berhasil masuk Library.","success");
    await loadMediaLibrary();
  }catch(err){
    msg(mediaUploadMessage,err.message,"error");
  }finally{
    mediaUploadSubmit.disabled=false;
  }
});
[mediaSearch,mediaCategoryFilter,mediaStatusFilter,mediaSort].forEach(el=>{
  el?.addEventListener(el?.tagName==="INPUT"?"input":"change",renderMediaLibrary);
});
mediaRefreshBtn?.addEventListener("click",loadMediaLibrary);
mediaLibraryGrid?.addEventListener("click",async e=>{
  const card=e.target.closest("[data-media-id]");
  if(!card)return;
  const asset=mediaLibraryCache.find(x=>String(x.id)===String(card.dataset.mediaId));
  if(!asset)return;
  try{
    const use=e.target.closest("[data-media-use]");
    const copy=e.target.closest("[data-media-copy]");
    const rename=e.target.closest("[data-media-rename]");
    const status=e.target.closest("[data-media-status]");
    const del=e.target.closest("[data-media-delete]");
    if(use)useMediaAsset(asset);
    if(copy){await copyMediaUrl(asset.public_url);copy.textContent="Copied!";setTimeout(()=>copy.textContent="Copy URL",1200);}
    if(rename){
      const name=prompt("Nama tampilan baru:",asset.display_name||asset.original_name);
      if(name?.trim()){
        const {error}=await sb.from("media_assets").update({display_name:name.trim(),updated_at:new Date().toISOString()}).eq("id",asset.id);
        if(error)throw error;
        await loadMediaLibrary();
      }
    }
    if(status)await updateMediaStatus(asset.id,status.dataset.mediaStatus);
    if(del)await deleteMediaAsset(asset);
  }catch(err){
    alert(err.message);
  }
});

event_title?.addEventListener("input",()=>{if(!editState.events||!event_slug.value)event_slug.value=slugify(event_title.value)});
news_title?.addEventListener("input",()=>{if(!editState.news||!news_slug.value)news_slug.value=slugify(news_title.value)});


/* =========================================================
   DOSMOS VIP V14.8 — COMMUNITY + DONATION ADMIN
========================================================= */
async function loadV148Settings(){
  const {data}=await sb.from("site_settings").select("*").limit(1).maybeSingle();
  if(!data)return;
  if(typeof community_chat_enabled!=="undefined")community_chat_enabled.value=String(data.community_chat_enabled!==false);
  if(typeof community_tiktok_url!=="undefined")community_tiktok_url.value=data.community_tiktok_url||"";
  if(typeof community_poll_question!=="undefined")community_poll_question.value=data.community_poll_question||"";
  if(typeof community_poll_enabled!=="undefined")community_poll_enabled.value=String(data.community_poll_enabled===true);
  if(typeof community_poll_a!=="undefined")community_poll_a.value=data.community_poll_a||"";
  if(typeof community_poll_b!=="undefined")community_poll_b.value=data.community_poll_b||"";
  if(typeof donation_enabled!=="undefined")donation_enabled.value=String(data.donation_enabled!==false);
  if(typeof donation_qris_url!=="undefined")donation_qris_url.value=data.donation_qris_url||"";
  if(typeof donation_goal_title!=="undefined")donation_goal_title.value=data.donation_goal_title||"";
  if(typeof donation_goal_target!=="undefined")donation_goal_target.value=data.donation_goal_target||10000000;
  if(typeof donation_minimum!=="undefined")donation_minimum.value=data.donation_minimum||10000;
  if(typeof donation_whatsapp!=="undefined")donation_whatsapp.value=data.donation_whatsapp||"";
}
communitySettingsForm?.addEventListener("submit",async e=>{
  e.preventDefault();msg(communitySettingsMessage,"Menyimpan...");
  const payload={community_chat_enabled:community_chat_enabled.value==="true",community_tiktok_url:community_tiktok_url.value.trim()||null,community_poll_question:community_poll_question.value.trim()||null,community_poll_enabled:community_poll_enabled.value==="true",community_poll_a:community_poll_a.value.trim()||null,community_poll_b:community_poll_b.value.trim()||null,updated_at:new Date().toISOString()};
  const {data:row}=await sb.from("site_settings").select("id").limit(1).maybeSingle();
  const q=row?sb.from("site_settings").update(payload).eq("id",row.id):sb.from("site_settings").insert(payload);
  const {error}=await q;msg(communitySettingsMessage,error?error.message:"Community settings tersimpan.",error?"error":"success");
});
donationSettingsForm?.addEventListener("submit",async e=>{
  e.preventDefault();msg(donationSettingsMessage,"Menyimpan...");
  const payload={donation_enabled:donation_enabled.value==="true",donation_qris_url:donation_qris_url.value.trim()||null,donation_goal_title:donation_goal_title.value.trim()||null,donation_goal_target:Number(donation_goal_target.value||0),donation_minimum:Number(donation_minimum.value||10000),donation_whatsapp:donation_whatsapp.value.trim()||null,updated_at:new Date().toISOString()};
  const {data:row}=await sb.from("site_settings").select("id").limit(1).maybeSingle();
  const q=row?sb.from("site_settings").update(payload).eq("id",row.id):sb.from("site_settings").insert(payload);
  const {error}=await q;msg(donationSettingsMessage,error?error.message:"Donation settings tersimpan.",error?"error":"success");
});
async function loadCommunityAdminMessages(){
  if(!communityAdminMessages)return;
  const {data,error}=await sb.from("community_messages").select("*").order("created_at",{ascending:false}).limit(100);
  if(error){communityAdminMessages.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;return}
  communityAdminMessages.innerHTML=(data||[]).map(m=>`<div class="admin-community-row"><div><strong>${esc(m.display_name)}</strong><p>${esc(m.message)}</p><small>${new Date(m.created_at).toLocaleString("id-ID")}</small></div><div><button class="btn btn-secondary" data-chat-toggle="${m.id}" data-hidden="${m.is_hidden}">${m.is_hidden?"Tampilkan":"Sembunyikan"}</button><button class="btn btn-danger" data-chat-delete="${m.id}">Hapus</button></div></div>`).join("")||'<div class="empty-state">Belum ada chat.</div>';
}
communityAdminMessages?.addEventListener("click",async e=>{
  const toggle=e.target.closest("[data-chat-toggle]"),del=e.target.closest("[data-chat-delete]");
  if(toggle){await sb.from("community_messages").update({is_hidden:toggle.dataset.hidden!=="true"}).eq("id",toggle.dataset.chatToggle);loadCommunityAdminMessages()}
  if(del&&confirm("Hapus pesan ini?")){await sb.from("community_messages").delete().eq("id",del.dataset.chatDelete);loadCommunityAdminMessages()}
});
communityChatRefresh?.addEventListener("click",loadCommunityAdminMessages);
async function loadAdminDonations(){
  if(!adminDonationList)return;
  const {data,error}=await sb.from("donations").select("*").order("created_at",{ascending:false}).limit(200);
  if(error){adminDonationList.innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;return}
  adminDonationList.innerHTML=(data||[]).map(d=>`<div class="admin-donation-row"><div><strong>${esc(d.anonymous?"Anonymous":d.donor_name)}</strong><p>${new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(d.amount)}</p><small>${esc(d.reference)} • ${esc(d.status)} • ${new Date(d.created_at).toLocaleString("id-ID")}</small>${d.message?`<em>${esc(d.message)}</em>`:""}</div><div class="admin-donation-actions"><button class="btn btn-primary" data-donation-status="paid" data-id="${d.id}">Paid</button><button class="btn btn-secondary" data-donation-status="rejected" data-id="${d.id}">Reject</button><button class="btn btn-danger" data-donation-delete="${d.id}">Delete</button></div></div>`).join("")||'<div class="empty-state">Belum ada donation.</div>';
}
adminDonationList?.addEventListener("click",async e=>{
  const status=e.target.closest("[data-donation-status]"),del=e.target.closest("[data-donation-delete]");
  if(status){await sb.from("donations").update({status:status.dataset.donationStatus,updated_at:new Date().toISOString()}).eq("id",status.dataset.id);loadAdminDonations()}
  if(del&&confirm("Hapus data donation ini?")){await sb.from("donations").delete().eq("id",del.dataset.donationDelete);loadAdminDonations()}
});
donationRefreshBtn?.addEventListener("click",loadAdminDonations);
setTimeout(()=>{loadV148Settings();loadCommunityAdminMessages();loadAdminDonations()},300);
