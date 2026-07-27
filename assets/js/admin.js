
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
async function uploadMedia(file,folder){
  if(!file)return null;
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from(cfg.storageBucket).upload(path,file,{cacheControl:"3600"});
  if(error)throw error;
  return sb.storage.from(cfg.storageBucket).getPublicUrl(path).data.publicUrl;
}
async function rows(table,order="created_at",asc=false){
  const {data,error}=await sb.from(table).select("*").order(order,{ascending:asc});
  if(error)throw error;return data||[];
}
function showTab(id){document.querySelector(`[data-tab="${id}"]`)?.click();window.scrollTo({top:0,behavior:"smooth"})}
window.deleteRow=async(table,id)=>{if(!confirm("Hapus data ini?"))return;const {error}=await sb.from(table).delete().eq("id",id);if(error){alert(error.message);return}await refreshAll()};
async function refreshAll(){
  await Promise.all([loadEvents(),loadRegistrations(),loadMatches(),loadChampions(),loadNews(),loadGallery(),loadSponsors(),loadSettings(),loadBranding()]);
  const tables=["events","registrations","matches","champions","news","gallery","sponsors"];
  for(const t of tables)document.getElementById("stat_"+t).textContent=(await rows(t)).length;
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
window.editEvent=e=>{editState.events=e.id;["title","description","banner","start_date","end_date","prize_pool","registration_link","status"].forEach(k=>document.getElementById("event_"+k).value=e[k]||"");eventSubmit.textContent="Simpan Perubahan";showTab("eventsTab")};
makeFormHandler({formId:"eventForm",table:"events",stateKey:"events",messageId:"eventMessage",submitId:"eventSubmit",payloadFn:async()=>{
  let banner=event_banner.value.trim()||null;if(event_file.files[0])banner=await uploadMedia(event_file.files[0],"events");
  return {title:event_title.value.trim(),description:event_description.value.trim(),banner,start_date:event_start_date.value||null,end_date:event_end_date.value||null,prize_pool:event_prize_pool.value.trim()||null,registration_link:event_registration_link.value.trim()||null,status:event_status.value,updated_at:new Date().toISOString()}
}});

/* registrations */
async function loadRegistrations(){
  const data=await rows("registrations");
  registrationRows.innerHTML=data.map(r=>`<tr><td>${esc(r.event_name)}</td><td>${esc(r.team_name)}</td><td>${esc(r.captain_name)}</td><td>${esc(r.whatsapp)}</td><td>${esc(r.status)}</td><td><select onchange="updateRegistration('${r.id}',this.value)"><option ${r.status==="pending"?"selected":""} value="pending">Pending</option><option ${r.status==="accepted"?"selected":""} value="accepted">Accepted</option><option ${r.status==="rejected"?"selected":""} value="rejected">Rejected</option></select></td><td><button class="btn btn-danger" onclick="deleteRow('registrations','${r.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="7">Belum ada pendaftaran.</td></tr>';
}
window.updateRegistration=async(id,status)=>{const {error}=await sb.from("registrations").update({status}).eq("id",id);if(error)alert(error.message)};

/* matches */
async function loadMatches(){
  const data=await rows("matches","sort_order",true);
  matchRows.innerHTML=data.map(m=>`<tr><td>${esc(m.event_name||"-")}</td><td>${esc(m.round_name)}</td><td>${esc(m.team_a)}</td><td>${m.score_a??0} - ${m.score_b??0}</td><td>${esc(m.team_b)}</td><td><button class="btn btn-secondary" onclick='editMatch(${JSON.stringify(m)})'>Edit</button></td><td><button class="btn btn-danger" onclick="deleteRow('matches','${m.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="7">Belum ada match.</td></tr>';
}
window.editMatch=m=>{editState.matches=m.id;["event_name","round_name","team_a","team_b","score_a","score_b","winner","sort_order"].forEach(k=>document.getElementById("match_"+k).value=m[k]??"");matchSubmit.textContent="Simpan Perubahan";showTab("matchesTab")};
makeFormHandler({formId:"matchForm",table:"matches",stateKey:"matches",messageId:"matchMessage",submitId:"matchSubmit",payloadFn:async()=>({event_name:match_event_name.value.trim(),round_name:match_round_name.value.trim(),team_a:match_team_a.value.trim(),team_b:match_team_b.value.trim(),score_a:Number(match_score_a.value||0),score_b:Number(match_score_b.value||0),winner:match_winner.value.trim(),sort_order:Number(match_sort_order.value||0)})});

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
window.editNews=n=>{editState.news=n.id;["title","summary","content","cover"].forEach(k=>document.getElementById("news_"+k).value=n[k]||"");newsSubmit.textContent="Simpan Perubahan";showTab("newsTab")};
makeFormHandler({formId:"newsForm",table:"news",stateKey:"news",messageId:"newsMessage",submitId:"newsSubmit",payloadFn:async()=>{
  let cover=news_cover.value.trim()||null;if(news_file.files[0])cover=await uploadMedia(news_file.files[0],"news");
  return {title:news_title.value.trim(),summary:news_summary.value.trim(),content:news_content.value.trim(),cover,published_at:new Date().toISOString()}
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
  background_color:"#080808"
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

  brandingPreviewName.textContent=name;
  brandingPreviewHeroName.textContent=name;
  brandingPreviewSlogan.textContent=slogan;
  if(!brandingPreviewLogo.dataset.objectUrl)brandingPreviewLogo.src=mainUrl;
  if(!brandingPreviewHero.dataset.objectUrl)brandingPreviewHero.src=heroUrl;

  const card=document.querySelector(".branding-preview-card");
  card?.style.setProperty("--brand-primary",primary);
  card?.style.setProperty("--brand-background",background);
}

function fillBrandingForm(data={}){
  savedBranding={
    site_name:data.site_name||"DOSMOS",
    slogan:data.slogan||"Every Gamer Deserves a Chance.",
    main_logo_url:data.main_logo_url||"../dosmos-logo.png",
    hero_logo_url:data.hero_logo_url||data.main_logo_url||"../dosmos-logo.png",
    favicon_url:data.favicon_url||data.main_logo_url||"../dosmos-logo.png",
    primary_color:validHex(data.primary_color)?data.primary_color:"#f6c744",
    background_color:validHex(data.background_color)?data.background_color:"#080808"
  };

  branding_site_name.value=savedBranding.site_name;
  branding_slogan.value=savedBranding.slogan;
  branding_main_logo_url.value=data.main_logo_url||"";
  branding_hero_logo_url.value=data.hero_logo_url||"";
  branding_favicon_url.value=data.favicon_url||"";
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
  branding_hero_logo_url,branding_favicon_url
].forEach(el=>el?.addEventListener("input",updateBrandingPreview));

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
