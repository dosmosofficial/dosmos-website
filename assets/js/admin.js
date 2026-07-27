
const cfg=window.DOSMOS_CONFIG;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const loginView=document.getElementById("loginView");
const dashboardView=document.getElementById("dashboardView");
const authMessage=document.getElementById("authMessage");

const editState={events:null,champions:null,news:null,gallery:null};
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const msg=(el,text,type="")=>{el.textContent=text;el.className="message "+type};

async function checkSession(){
  const {data:{session}}=await sb.auth.getSession();
  if(session){
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    await refreshAll();
  }else{
    loginView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
  }
}
document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();msg(authMessage,"Memproses...");
  const {error}=await sb.auth.signInWithPassword({
    email:document.getElementById("loginEmail").value.trim(),
    password:document.getElementById("loginPassword").value
  });
  if(error){msg(authMessage,error.message,"error");return}
  msg(authMessage,"Login berhasil.","success");await checkSession();
});
document.getElementById("logoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});

document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(btn.dataset.tab).classList.add("active");
}));

async function uploadMedia(file,folder){
  if(!file)return null;
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from(cfg.storageBucket).upload(path,file,{upsert:false,cacheControl:"3600"});
  if(error)throw error;
  return sb.storage.from(cfg.storageBucket).getPublicUrl(path).data.publicUrl;
}
async function getRows(table,order="created_at"){
  const {data,error}=await sb.from(table).select("*").order(order,{ascending:false});
  if(error)throw error;
  return data||[];
}
async function refreshAll(){
  await Promise.all([loadEvents(),loadChampions(),loadNews(),loadGallery(),loadSettings()]);
  document.getElementById("statEvents").textContent=(await getRows("events")).length;
  document.getElementById("statChampions").textContent=(await getRows("champions")).length;
  document.getElementById("statNews").textContent=(await getRows("news")).length;
  document.getElementById("statGallery").textContent=(await getRows("gallery")).length;
}
function showTab(id){document.querySelector(`[data-tab="${id}"]`)?.click();window.scrollTo({top:0,behavior:"smooth"})}
window.deleteRow=async(table,id)=>{
  if(!confirm("Hapus data ini?"))return;
  const {error}=await sb.from(table).delete().eq("id",id);
  if(error){alert(error.message);return}
  await refreshAll();
};

async function loadEvents(){
  const rows=await getRows("events");
  document.getElementById("eventRows").innerHTML=rows.map(e=>`<tr>
    <td>${esc(e.title)}</td><td>${esc(e.status||"")}</td><td>${esc(e.start_date||"-")}</td><td>${esc(e.prize_pool||"-")}</td>
    <td><button class="btn btn-secondary" onclick='editEvent(${JSON.stringify(e)})'>Edit</button></td>
    <td><button class="btn btn-danger" onclick="deleteRow('events','${e.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada event.</td></tr>';
}
window.editEvent=e=>{
  editState.events=e.id;
  ["title","description","banner","start_date","end_date","prize_pool","registration_link","status"].forEach(k=>document.getElementById("event_"+k).value=e[k]||"");
  document.getElementById("eventSubmit").textContent="Simpan Perubahan";showTab("eventsTab");
};
document.getElementById("eventForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("eventMessage");
  try{
    let banner=document.getElementById("event_banner").value.trim()||null;
    const file=document.getElementById("event_file").files[0];
    if(file)banner=await uploadMedia(file,"events");
    const payload={
      title:document.getElementById("event_title").value.trim(),
      description:document.getElementById("event_description").value.trim(),
      banner,
      start_date:document.getElementById("event_start_date").value||null,
      end_date:document.getElementById("event_end_date").value||null,
      prize_pool:document.getElementById("event_prize_pool").value.trim()||null,
      registration_link:document.getElementById("event_registration_link").value.trim()||null,
      status:document.getElementById("event_status").value,
      updated_at:new Date().toISOString()
    };
    const q=editState.events?sb.from("events").update(payload).eq("id",editState.events):sb.from("events").insert(payload);
    const {error}=await q;if(error)throw error;
    msg(out,"Event berhasil disimpan.","success");editState.events=null;e.target.reset();document.getElementById("eventSubmit").textContent="Publish";await refreshAll();
  }catch(err){msg(out,err.message,"error")}
});

async function loadChampions(){
  const rows=await getRows("champions");
  document.getElementById("championRows").innerHTML=rows.map(c=>`<tr>
    <td>${esc(c.team_name)}</td><td>${esc(c.rank||"")}</td><td>${esc(c.event_name||"-")}</td><td>${esc(c.mvp||"-")}</td>
    <td><button class="btn btn-secondary" onclick='editChampion(${JSON.stringify(c)})'>Edit</button></td>
    <td><button class="btn btn-danger" onclick="deleteRow('champions','${c.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada champion.</td></tr>';
}
window.editChampion=c=>{
  editState.champions=c.id;
  ["team_name","rank","event_name","mvp","prize","story","photo"].forEach(k=>document.getElementById("champion_"+k).value=c[k]||"");
  document.getElementById("championSubmit").textContent="Simpan Perubahan";showTab("championsTab");
};
document.getElementById("championForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("championMessage");
  try{
    let photo=document.getElementById("champion_photo").value.trim()||null;
    const file=document.getElementById("champion_file").files[0];
    if(file)photo=await uploadMedia(file,"champions");
    const payload={
      team_name:document.getElementById("champion_team_name").value.trim(),
      rank:document.getElementById("champion_rank").value.trim(),
      event_name:document.getElementById("champion_event_name").value.trim(),
      mvp:document.getElementById("champion_mvp").value.trim(),
      prize:document.getElementById("champion_prize").value.trim(),
      story:document.getElementById("champion_story").value.trim(),
      photo
    };
    const q=editState.champions?sb.from("champions").update(payload).eq("id",editState.champions):sb.from("champions").insert(payload);
    const {error}=await q;if(error)throw error;
    msg(out,"Champion berhasil disimpan.","success");editState.champions=null;e.target.reset();document.getElementById("championSubmit").textContent="Publish";await refreshAll();
  }catch(err){msg(out,err.message,"error")}
});

async function loadNews(){
  const rows=await getRows("news","published_at");
  document.getElementById("newsRows").innerHTML=rows.map(n=>`<tr>
    <td>${esc(n.title)}</td><td>${esc(n.summary||"-")}</td><td>${esc((n.published_at||"").slice(0,10))}</td>
    <td><button class="btn btn-secondary" onclick='editNews(${JSON.stringify(n)})'>Edit</button></td>
    <td><button class="btn btn-danger" onclick="deleteRow('news','${n.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="5">Belum ada berita.</td></tr>';
}
window.editNews=n=>{
  editState.news=n.id;
  ["title","summary","content","cover"].forEach(k=>document.getElementById("news_"+k).value=n[k]||"");
  document.getElementById("newsSubmit").textContent="Simpan Perubahan";showTab("newsTab");
};
document.getElementById("newsForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("newsMessage");
  try{
    let cover=document.getElementById("news_cover").value.trim()||null;
    const file=document.getElementById("news_file").files[0];
    if(file)cover=await uploadMedia(file,"news");
    const payload={
      title:document.getElementById("news_title").value.trim(),
      summary:document.getElementById("news_summary").value.trim(),
      content:document.getElementById("news_content").value.trim(),
      cover,
      published_at:new Date().toISOString()
    };
    const q=editState.news?sb.from("news").update(payload).eq("id",editState.news):sb.from("news").insert(payload);
    const {error}=await q;if(error)throw error;
    msg(out,"Berita berhasil disimpan.","success");editState.news=null;e.target.reset();document.getElementById("newsSubmit").textContent="Publish";await refreshAll();
  }catch(err){msg(out,err.message,"error")}
});

async function loadGallery(){
  const rows=await getRows("gallery");
  document.getElementById("galleryRows").innerHTML=rows.map(g=>`<tr>
    <td>${esc(g.caption||"-")}</td><td>${esc(g.event_name||"-")}</td><td><a href="${esc(g.image_url)}" target="_blank">Lihat</a></td>
    <td><button class="btn btn-secondary" onclick='editGallery(${JSON.stringify(g)})'>Edit</button></td>
    <td><button class="btn btn-danger" onclick="deleteRow('gallery','${g.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="5">Belum ada galeri.</td></tr>';
}
window.editGallery=g=>{
  editState.gallery=g.id;
  ["caption","event_name","image_url"].forEach(k=>document.getElementById("gallery_"+k).value=g[k]||"");
  document.getElementById("gallerySubmit").textContent="Simpan Perubahan";showTab("galleryTab");
};
document.getElementById("galleryForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("galleryMessage");
  try{
    let image_url=document.getElementById("gallery_image_url").value.trim()||null;
    const file=document.getElementById("gallery_file").files[0];
    if(file)image_url=await uploadMedia(file,"gallery");
    if(!image_url)throw new Error("Gambar wajib diisi.");
    const payload={
      caption:document.getElementById("gallery_caption").value.trim(),
      event_name:document.getElementById("gallery_event_name").value.trim(),
      image_url
    };
    const q=editState.gallery?sb.from("gallery").update(payload).eq("id",editState.gallery):sb.from("gallery").insert(payload);
    const {error}=await q;if(error)throw error;
    msg(out,"Galeri berhasil disimpan.","success");editState.gallery=null;e.target.reset();document.getElementById("gallerySubmit").textContent="Publish";await refreshAll();
  }catch(err){msg(out,err.message,"error")}
});

async function loadSettings(){
  const {data}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(!data)return;
  ["whatsapp","email","instagram","tiktok","discord"].forEach(k=>document.getElementById("settings_"+k).value=data[k]||"");
}
document.getElementById("settingsForm").addEventListener("submit",async e=>{
  e.preventDefault();const out=document.getElementById("settingsMessage");
  const payload={
    id:1,
    whatsapp:document.getElementById("settings_whatsapp").value.trim(),
    email:document.getElementById("settings_email").value.trim(),
    instagram:document.getElementById("settings_instagram").value.trim(),
    tiktok:document.getElementById("settings_tiktok").value.trim(),
    discord:document.getElementById("settings_discord").value.trim(),
    updated_at:new Date().toISOString()
  };
  const {error}=await sb.from("site_settings").upsert(payload);
  if(error){msg(out,error.message,"error");return}
  msg(out,"Settings berhasil disimpan.","success");
});

checkSession();
