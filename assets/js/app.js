const cfg = window.DOSMOS_CONFIG;
const supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);

function esc(v=""){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function formatDate(v){
  if(!v) return "Segera diumumkan";
  return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(v+"T00:00:00"));
}
function statusText(v){
  const s=String(v||"upcoming").toLowerCase();
  if(["active","ongoing","open"].includes(s)) return "Sedang Berjalan";
  if(["finished","done","completed"].includes(s)) return "Selesai";
  return "Akan Datang";
}
async function loadEvents(){
  const grid=document.getElementById("eventGrid");
  try{
    const {data,error}=await supabaseClient.from("events").select("*").order("start_date",{ascending:true});
    if(error) throw error;
    if(!data?.length){
      grid.innerHTML='<div class="empty">Belum ada event yang dipublikasikan.</div>';return;
    }
    grid.innerHTML=data.map(e=>{
      const bg=e.banner?`linear-gradient(to top,rgba(5,5,5,.97),rgba(5,5,5,.1)),url("${esc(e.banner)}")`:"";
      return `<article class="card">
        <div class="event-cover" ${bg?`style='background:${bg} center/cover'`:""}>
          <div><span class="status">${esc(statusText(e.status))}</span><h3>${esc(e.title)}</h3></div>
        </div>
        <div class="card-body">
          <p class="lead">${esc(e.description||"Detail event akan segera diumumkan.")}</p>
          <div class="meta-grid">
            <div class="meta"><small>Mulai</small><strong>${esc(formatDate(e.start_date))}</strong></div>
            <div class="meta"><small>Selesai</small><strong>${esc(formatDate(e.end_date))}</strong></div>
            <div class="meta"><small>Prize Pool</small><strong>${esc(e.prize_pool||"Segera diumumkan")}</strong></div>
          </div>
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${esc(e.registration_link||"https://wa.me/6281288836205")}">Daftar / Hubungi Panitia</a>
        </div>
      </article>`;
    }).join("");
  }catch(err){
    console.error(err);
    grid.innerHTML='<div class="empty">Event gagal dimuat. Periksa policy Supabase.</div>';
  }
}
loadEvents();

document.querySelectorAll(".logo").forEach(img=>{
  img.addEventListener("error",()=>{img.style.display="none";const fb=img.nextElementSibling;if(fb)fb.style.display="grid"});
  img.addEventListener("load",()=>{const fb=img.nextElementSibling;if(fb)fb.style.display="none"});
});
