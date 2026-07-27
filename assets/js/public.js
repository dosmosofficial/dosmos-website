
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

async function getRows(table, orderCol="created_at", ascending=false){
  const {data,error}=await sb.from(table).select("*").order(orderCol,{ascending});
  if(error) throw error;
  return data||[];
}

function renderCards(rows, type){
  if(!rows.length) return '<div class="empty">Belum ada data.</div>';

  if(type==="events"){
    return rows.map(e=>{
      const bg=e.banner?`linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(e.banner)}")`:"";
      return `<article class="card">
        <div class="cover" ${bg?`style='background:${bg} center/cover'`:""}>
          <div><span class="status">${esc(statusText(e.status))}</span><h3>${esc(e.title)}</h3></div>
        </div>
        <div class="card-body">
          <p class="lead">${esc(e.description||"Detail event segera diumumkan.")}</p>
          <div class="meta-grid">
            <div class="meta"><small>Mulai</small><strong>${esc(fmtDate(e.start_date))}</strong></div>
            <div class="meta"><small>Selesai</small><strong>${esc(fmtDate(e.end_date))}</strong></div>
            <div class="meta"><small>Prize Pool</small><strong>${esc(e.prize_pool||"Segera diumumkan")}</strong></div>
          </div>
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${esc(e.registration_link||"https://wa.me/6281288836205")}">Daftar / Hubungi Panitia</a>
        </div>
      </article>`;
    }).join("");
  }

  if(type==="champions"){
    return rows.map(c=>`
      <article class="card">
        <div class="cover" ${c.photo?`style='background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(c.photo)}") center/cover'`:""}>
          <div><span class="status">${esc(c.rank||"Champion")}</span><h3>${esc(c.team_name)}</h3></div>
        </div>
        <div class="card-body">
          <p class="lead">${esc(c.story||"Perjalanan sang juara akan ditampilkan di sini.")}</p>
          <div class="meta-grid">
            <div class="meta"><small>Event</small><strong>${esc(c.event_name||"-")}</strong></div>
            <div class="meta"><small>MVP</small><strong>${esc(c.mvp||"-")}</strong></div>
            <div class="meta"><small>Hadiah</small><strong>${esc(c.prize||"-")}</strong></div>
          </div>
        </div>
      </article>`).join("");
  }

  if(type==="news"){
    return rows.map(n=>`
      <article class="card">
        <div class="cover" ${n.cover?`style='background:linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(n.cover)}") center/cover'`:""}>
          <h3>${esc(n.title)}</h3>
        </div>
        <div class="card-body"><p class="lead">${esc(n.summary||n.content||"")}</p></div>
      </article>`).join("");
  }

  return rows.map(g=>`
    <article class="card">
      <div class="cover" style='background:linear-gradient(to top,rgba(5,5,5,.9),rgba(5,5,5,.05)),url("${esc(g.image_url)}") center/cover'>
        <h3>${esc(g.caption||"DOSMOS Moment")}</h3>
      </div>
    </article>`).join("");
}

async function loadAll(){
  const targets={
    events:["eventGrid","events","start_date",true],
    champions:["championGrid","champions","created_at",false],
    news:["newsGrid","news","published_at",false],
    gallery:["galleryGrid","gallery","created_at",false],
  };
  for(const [type,[id,table,order,asc]] of Object.entries(targets)){
    const el=document.getElementById(id);
    try{ el.innerHTML=renderCards(await getRows(table,order,asc),type); }
    catch(e){ el.innerHTML=`<div class="empty">${type} gagal dimuat.</div>`; console.error(e); }
  }

  try{
    const {data}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(data){
      document.querySelectorAll("[data-wa]").forEach(a=>a.href=`https://wa.me/${String(data.whatsapp||"6281288836205").replace(/\D/g,"")}`);
      document.querySelectorAll("[data-email]").forEach(a=>{a.href=`mailto:${data.email||"dosmosid@gmail.com"}`;a.querySelector("strong")&&(a.querySelector("strong").textContent=data.email||"dosmosid@gmail.com")});
      document.querySelectorAll("[data-instagram]").forEach(a=>a.href=data.instagram||"https://instagram.com/dosmos.id");
      document.querySelectorAll("[data-tiktok]").forEach(a=>a.href=data.tiktok||"#");
      document.querySelectorAll("[data-discord]").forEach(a=>a.href=data.discord||"#");
    }
  }catch(e){console.error(e)}
}

document.querySelectorAll(".logo").forEach(img=>{
  img.addEventListener("error",()=>{img.style.display="none";const fb=img.nextElementSibling;if(fb)fb.style.display="grid"});
  img.addEventListener("load",()=>{const fb=img.nextElementSibling;if(fb)fb.style.display="none"});
});
const menuBtn=document.getElementById("menuBtn");
const navLinks=document.getElementById("navLinks");
menuBtn?.addEventListener("click",()=>navLinks.classList.toggle("open"));
navLinks?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>navLinks.classList.remove("open")));

loadAll();
