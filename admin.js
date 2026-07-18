const DATA_KEY = "zhrp-panel-draft-v3";
const USERS_KEY = "zhrp-panel-users-v3";
const DB_NAME = "zhrp-media-v3";
let currentUser = null;
let data = loadJson(DATA_KEY, window.ZERO_HOUR_SITE_DATA || {gallery:[],videos:[],updates:[]});
let users = loadJson(USERS_KEY, window.ZERO_HOUR_PANEL_USERS || [{username:"owner",password:"change-me",role:"owner"}]);
data.gallery ||= []; data.videos ||= []; data.updates ||= [];

const loginView = document.getElementById("loginView");
const panelView = document.getElementById("panelView");
const statusMessage = document.getElementById("statusMessage");

function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)) || JSON.parse(JSON.stringify(fallback));}catch{return JSON.parse(JSON.stringify(fallback));}}
function persist(){localStorage.setItem(DATA_KEY,JSON.stringify(data));localStorage.setItem(USERS_KEY,JSON.stringify(users));}
function safeName(name){return name.replace(/[^a-z0-9._-]/gi,"-");}
function escapeHtml(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML;}
function isOwner(){return currentUser?.role === "owner";}

document.getElementById("loginButton").addEventListener("click",login);
document.getElementById("password").addEventListener("keydown",e=>{if(e.key==="Enter")login();});
function login(){
  const u=document.getElementById("username").value.trim();
  const p=document.getElementById("password").value;
  const found=users.find(x=>x.username===u&&x.password===p);
  if(!found){document.getElementById("loginMessage").textContent="Incorrect username or password.";return;}
  currentUser=found; loginView.hidden=true; panelView.hidden=false;
  document.getElementById("roleText").textContent=`Signed in as ${found.username} (${found.role}).`;
  document.getElementById("staffTab").style.display=isOwner()?"inline-block":"none";
  renderAll();
}
document.getElementById("logoutButton").addEventListener("click",()=>location.reload());

document.querySelectorAll(".panel-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".panel-tabs button").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".manager").forEach(m=>m.classList.remove("active"));
  btn.classList.add("active"); document.getElementById(btn.dataset.panel).classList.add("active");
}));

document.getElementById("photoInput").addEventListener("change",async e=>{
  for(const file of e.target.files){
    const path=`images/uploads/${Date.now()}-${Math.random().toString(36).slice(2,7)}-${safeName(file.name)}`;
    await saveMedia(path,file);
    data.gallery.push({image:path,caption:file.name.replace(/\.[^.]+$/,"")});
  }
  persist();renderGallery();e.target.value="";
});
document.getElementById("videoInput").addEventListener("change",async e=>{
  for(const file of e.target.files){
    const path=`images/uploads/${Date.now()}-${Math.random().toString(36).slice(2,7)}-${safeName(file.name)}`;
    await saveMedia(path,file);
    data.videos.push({type:"upload",src:path,mimeType:file.type||"video/mp4",title:file.name.replace(/\.[^.]+$/,""),description:""});
  }
  persist();renderVideos();e.target.value="";
});

function renderAll(){renderGallery();renderVideos();renderUpdates();renderStaff();}
async function renderGallery(){
  const root=document.getElementById("galleryEditor");root.innerHTML="";
  for(let i=0;i<data.gallery.length;i++){
    const item=data.gallery[i], card=document.createElement("article");card.className="editor-card";
    const preview=document.createElement("div");preview.className="preview";
    const img=document.createElement("img");img.alt=item.caption||"Screenshot";img.src=await mediaUrl(item.image);img.onerror=()=>img.style.display="none";preview.append(img);
    card.innerHTML="";card.append(preview);
    card.insertAdjacentHTML("beforeend",`<div class="field"><label>Caption<input value="${escapeHtml(item.caption)}"></label></div><div class="actions"></div>`);
    card.querySelector("input").addEventListener("input",e=>{item.caption=e.target.value;persist();});
    const a=card.querySelector(".actions");
    addAction(a,"Move Up",()=>move(data.gallery,i,-1,renderGallery));
    addAction(a,"Move Down",()=>move(data.gallery,i,1,renderGallery));
    if(isOwner())addAction(a,"Delete",async()=>{await deleteMedia(item.image);data.gallery.splice(i,1);persist();renderGallery();},"delete");
    root.append(card);
  }
}
async function renderVideos(){
  const root=document.getElementById("videoEditor");root.innerHTML="";
  for(let i=0;i<data.videos.length;i++){
    const item=data.videos[i],card=document.createElement("article");card.className="editor-card";
    const preview=document.createElement("div");preview.className="preview";const video=document.createElement("video");video.controls=true;video.src=await mediaUrl(item.src);preview.append(video);card.append(preview);
    card.insertAdjacentHTML("beforeend",`<div class="field"><label>Title<input value="${escapeHtml(item.title)}"></label></div><div class="field"><label>Description<textarea rows="5">${escapeHtml(item.description)}</textarea></label></div><div class="actions"></div>`);
    const fields=card.querySelectorAll("input,textarea");fields[0].addEventListener("input",e=>{item.title=e.target.value;persist();});fields[1].addEventListener("input",e=>{item.description=e.target.value;persist();});
    const a=card.querySelector(".actions");addAction(a,"Move Up",()=>move(data.videos,i,-1,renderVideos));addAction(a,"Move Down",()=>move(data.videos,i,1,renderVideos));
    if(isOwner())addAction(a,"Delete",async()=>{await deleteMedia(item.src);data.videos.splice(i,1);persist();renderVideos();},"delete");
    root.append(card);
  }
}
function renderUpdates(){
  const root=document.getElementById("updatesEditor");root.innerHTML="";
  data.updates.forEach((item,i)=>{
    const card=document.createElement("article");card.className="list-card";
    card.innerHTML=`<div class="field"><label>Tag<input value="${escapeHtml(item.tag)}"></label></div><div class="field"><label>Title<input value="${escapeHtml(item.title)}"></label></div><div class="field" style="grid-column:1/-1"><label>Message<textarea rows="4">${escapeHtml(item.body)}</textarea></label></div><div class="actions"></div>`;
    const f=card.querySelectorAll("input,textarea");f[0].oninput=e=>{item.tag=e.target.value;persist()};f[1].oninput=e=>{item.title=e.target.value;persist()};f[2].oninput=e=>{item.body=e.target.value;persist()};
    const a=card.querySelector(".actions");addAction(a,"Move Up",()=>move(data.updates,i,-1,renderUpdates));addAction(a,"Move Down",()=>move(data.updates,i,1,renderUpdates));if(isOwner())addAction(a,"Delete",()=>{data.updates.splice(i,1);persist();renderUpdates()},"delete");
    root.append(card);
  });
}
document.getElementById("addUpdate").onclick=()=>{data.updates.unshift({tag:"UPDATE",title:"New city update",body:"Write the announcement here."});persist();renderUpdates();};
function renderStaff(){
  const root=document.getElementById("staffEditor");root.innerHTML="";if(!isOwner())return;
  users.forEach((user,i)=>{
    const card=document.createElement("article");card.className="list-card";
    card.innerHTML=`<div class="field"><label>Username<input value="${escapeHtml(user.username)}"></label></div><div class="field"><label>Password<input value="${escapeHtml(user.password)}"></label></div><div class="field"><label>Role<select><option value="staff">Staff</option><option value="owner">Owner</option></select></label></div><div class="actions"></div>`;
    const input=card.querySelectorAll("input");const select=card.querySelector("select");select.value=user.role;input[0].oninput=e=>{user.username=e.target.value;persist()};input[1].oninput=e=>{user.password=e.target.value;persist()};select.onchange=e=>{user.role=e.target.value;persist()};
    if(users.length>1)addAction(card.querySelector(".actions"),"Delete Account",()=>{users.splice(i,1);persist();renderStaff()},"delete");root.append(card);
  });
}
document.getElementById("addStaff").onclick=()=>{users.push({username:"newstaff",password:"change-me",role:"staff"});persist();renderStaff();};
function addAction(root,text,fn,cls=""){const b=document.createElement("button");b.textContent=text;b.className=cls;b.onclick=fn;root.append(b);}
function move(arr,i,delta,render){const j=i+delta;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];persist();render();}

let dbPromise;
function db(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("files"))r.result.createObjectStore("files")};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbPromise;}
async function saveMedia(path,file){const d=await db();return new Promise((res,rej)=>{const t=d.transaction("files","readwrite");t.objectStore("files").put(file,path);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function getMedia(path){const d=await db();return new Promise((res,rej)=>{const t=d.transaction("files","readonly");const r=t.objectStore("files").get(path);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function deleteMedia(path){const d=await db();return new Promise((res,rej)=>{const t=d.transaction("files","readwrite");t.objectStore("files").delete(path);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function mediaUrl(path){const f=await getMedia(path);return f?URL.createObjectURL(f):path;}

document.getElementById("resetDraftButton").onclick=async()=>{if(!confirm("Clear the saved panel draft and reload the published website data?"))return;localStorage.removeItem(DATA_KEY);location.reload();};

document.getElementById("saveFolderButton").onclick=async()=>{
  try{
    if(!window.showDirectoryPicker)throw new Error("Use Microsoft Edge or Google Chrome for folder saving.");
    statusMessage.textContent="Choose an empty folder...";
    const root=await showDirectoryPicker({mode:"readwrite"});
    const baseFiles=["index.html","style.css","site.js","admin.html","admin.css","admin.js","config.js","panel-users.js"];
    for(const p of baseFiles){const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw new Error(`Could not read ${p}`);await writePath(root,p,r);}
    const clean={gallery:[],videos:[],updates:data.updates};
    for(const item of data.gallery){const f=await getMedia(item.image);if(f){await writePath(root,item.image,f);clean.gallery.push(item)}else{const r=await fetch(item.image,{cache:"no-store"});if(r.ok){await writePath(root,item.image,r);clean.gallery.push(item)}}}
    for(const item of data.videos){const f=await getMedia(item.src);if(f){await writePath(root,item.src,f);clean.videos.push(item)}else{const r=await fetch(item.src,{cache:"no-store"});if(r.ok){await writePath(root,item.src,r);clean.videos.push(item)}}}
    await writePath(root,"site-data.js",new Blob(["window.ZERO_HOUR_SITE_DATA = "+JSON.stringify(clean,null,2)+";\n"],{type:"text/javascript"}));
    await writePath(root,"panel-users.js",new Blob(["window.ZERO_HOUR_PANEL_USERS = "+JSON.stringify(users,null,2)+";\n"],{type:"text/javascript"}));
    statusMessage.textContent="Complete website folder saved. Upload everything inside that folder to your GitHub repository.";
  }catch(e){console.error(e);statusMessage.textContent="Could not save website folder: "+(e.message||e);}
};
async function writePath(root,path,body){const parts=path.split("/"),name=parts.pop();let dir=root;for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});const h=await dir.getFileHandle(name,{create:true});const w=await h.createWritable();if(body instanceof Response&&body.body){await body.body.pipeTo(w)}else if(body.stream){await body.stream().pipeTo(w)}else{await w.write(body);await w.close();}}