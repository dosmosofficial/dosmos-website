const cfg=window.DOSMOS_CONFIG;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const loginView=document.getElementById("loginView");
const dashboardView=document.getElementById("dashboardView");
const msg=document.getElementById("authMessage");
let editingId=null;

function showMessage(el,text,type=""){el.textContent=text;el.className="message "+type}
async function checkSession(){
  const {data:{session}}=await sb.auth.getSession();
  if(session){loginView.classList.add("hidden");dashboardView.classList.remove("hidden");await loadAdminEvents()}
  else{loginView.classList.remove("hidden");dashboardView.classList.add("hidden")}
}
document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  showMessage(msg,"Memproses...");
  const email=document.getElementById("loginEmail").value.trim();
  const password=document.getElementById("loginPassword").value;
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){showMessage(msg,error.message,"error");return}
  showMessage(msg,"Login berhasil.","success");await checkSession();
});
document.getElementById("logoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});

function formData(){
  return {
    title:document.getElementById("title").value.trim(),
    description:document.getElementById("description").value.trim(),
    banner:document.getElementById("banner").value.trim()||null,
    start_date:document.getElementById("startDate").value||null,
    end_date:document.getElementById("endDate").value||null,
    prize_pool:document.getElementById("prizePool").value.trim()||null,
    registration_link:document.getElementById("registrationLink").value.trim()||null,
    status:document.getElementById("status").value,
    updated_at:new Date().toISOString()
  };
}
document.getElementById("eventForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const out=document.getElementById("eventMessage");
  const payload=formData();
  if(!payload.title){showMessage(out,"Judul wajib diisi.","error");return}
  let result;
  if(editingId) result=await sb.from("events").update(payload).eq("id",editingId);
  else result=await sb.from("events").insert(payload);
  if(result.error){showMessage(out,result.error.message,"error");return}
  showMessage(out,editingId?"Event berhasil diperbarui.":"Event berhasil ditambahkan.","success");
  resetForm();await loadAdminEvents();
});
function resetForm(){
  editingId=null;document.getElementById("eventForm").reset();
  document.getElementById("submitBtn").textContent="Publish Event";
  document.getElementById("cancelEdit").classList.add("hidden");
}
document.getElementById("cancelEdit").addEventListener("click",resetForm);

async function loadAdminEvents(){
  const body=document.getElementById("eventRows");
  const {data,error}=await sb.from("events").select("*").order("created_at",{ascending:false});
  if(error){body.innerHTML=`<tr><td colspan="6">${error.message}</td></tr>`;return}
  body.innerHTML=(data||[]).map(e=>`<tr>
    <td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.status||"")}</td>
    <td>${escapeHtml(e.start_date||"-")}</td><td>${escapeHtml(e.prize_pool||"-")}</td>
    <td><button class="btn btn-secondary" onclick='editEvent(${JSON.stringify(e)})'>Edit</button></td>
    <td><button class="btn btn-danger" onclick="deleteEvent('${e.id}')">Hapus</button></td>
  </tr>`).join("")||'<tr><td colspan="6">Belum ada event.</td></tr>';
}
window.editEvent=e=>{
  editingId=e.id;
  document.getElementById("title").value=e.title||"";
  document.getElementById("description").value=e.description||"";
  document.getElementById("banner").value=e.banner||"";
  document.getElementById("startDate").value=e.start_date||"";
  document.getElementById("endDate").value=e.end_date||"";
  document.getElementById("prizePool").value=e.prize_pool||"";
  document.getElementById("registrationLink").value=e.registration_link||"";
  document.getElementById("status").value=e.status||"upcoming";
  document.getElementById("submitBtn").textContent="Simpan Perubahan";
  document.getElementById("cancelEdit").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
};
window.deleteEvent=async id=>{
  if(!confirm("Hapus event ini?"))return;
  const {error}=await sb.from("events").delete().eq("id",id);
  if(error){alert(error.message);return}
  await loadAdminEvents();
};
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
checkSession();
