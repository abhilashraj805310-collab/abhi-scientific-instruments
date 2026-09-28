/* Abhi Scientific Instruments - site interactions */
const menuBtn=document.querySelector('.menu'), navLinks=document.querySelector('.navlinks');
if(menuBtn && navLinks) menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add('show');});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('.counter').forEach(el=>{
  let done=false, target=Number(el.dataset.target||0);
  const counterObserver=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!done){
      done=true; let value=0;
      const timer=setInterval(()=>{
        value=Math.min(target,value+Math.max(1,Math.ceil(target/40)));
        el.textContent=value+(el.dataset.suffix||'');
        if(value>=target) clearInterval(timer);
      },25);
    }
  });
  counterObserver.observe(el);
});

/* Catalogue Admin: Ctrl + Shift + A */
(function(){
  const ADMIN_EMAIL='abhiscientifiinstoffice@gmail.com';
  const KEY='asi_catalogue_admin_email';
  const DB='asi_catalogue_db';
  const STORE='catalogues';

  function injectStyles(){
    if(document.getElementById('asi-admin-css')) return;
    const s=document.createElement('style'); s.id='asi-admin-css';
    s.textContent=`
      #asiAdminOverlay{position:fixed;inset:0;z-index:99999;display:none;background:rgba(3,4,94,.58);backdrop-filter:blur(7px);padding:22px;overflow:auto}
      #asiAdminOverlay.open{display:flex;align-items:center;justify-content:center}
      .asi-admin-box{width:min(720px,100%);background:#fff;border:1px solid #d8e8f0;border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.25);padding:28px;color:#16324a;font-family:Inter,Segoe UI,Arial,sans-serif}
      .asi-admin-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
      .asi-admin-head h2{margin:0;color:#03045e;font-size:1.55rem}
      .asi-admin-close{border:1px solid #d8e8f0;background:#f7fbfd;border-radius:10px;width:38px;height:38px;cursor:pointer;font-size:18px}
      .asi-admin-note{background:#eefaff;border:1px solid #c9edf5;border-radius:13px;padding:13px 15px;margin:18px 0;color:#315d70;font-size:.9rem}
      .asi-admin-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .asi-admin-input{height:44px;flex:1;min-width:240px;border:1px solid #cddfe8;border-radius:10px;padding:0 13px;outline:0}
      .asi-admin-input:focus{border-color:#00b4d8;box-shadow:0 0 0 3px rgba(0,180,216,.12)}
      .asi-admin-btn{border:0;border-radius:10px;padding:11px 16px;background:#0077b6;color:#fff;font-weight:800;cursor:pointer}
      .asi-admin-btn.secondary{background:#03045e}
      .asi-admin-btn.danger{background:#a62b2b}
      .asi-file{width:100%;padding:18px;border:2px dashed #b7dfe9;border-radius:14px;background:#f7fcfe;margin-top:15px}
      .asi-status{margin-top:12px;font-size:.9rem;font-weight:700}
      .asi-list{margin-top:18px;border-top:1px solid #e2edf2;padding-top:14px}
      .asi-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #edf2f5}
      .asi-item-name{font-weight:750;color:#03045e;overflow:hidden;text-overflow:ellipsis}
      .asi-small{font-size:.78rem;color:#718594}
      .asi-hidden{display:none!important}
      @media(max-width:600px){#asiAdminOverlay{padding:10px}.asi-admin-box{padding:20px}.asi-item{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function saveFile(file){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).add({name:file.name,type:file.type,size:file.size,created:new Date().toISOString(),blob:file});
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
    });
  }
  async function getFiles(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'), req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function deleteFile(id){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(id);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  async function downloadFile(item){
    const url=URL.createObjectURL(item.blob);
    const a=document.createElement('a'); a.href=url; a.download=item.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function build(){
    injectStyles();
    if(document.getElementById('asiAdminOverlay')) return;
    const overlay=document.createElement('div'); overlay.id='asiAdminOverlay';
    overlay.innerHTML=`
      <div class="asi-admin-box">
        <div class="asi-admin-head">
          <div><div class="kicker">ADMIN PANEL</div><h2>Catalogue Manager</h2></div>
          <button class="asi-admin-close" aria-label="Close">×</button>
        </div>
        <div id="asiLogin">
          <div class="asi-admin-note"><b>Ctrl + Shift + A</b> opens this catalogue manager. Enter the authorized admin email to continue.</div>
          <div class="asi-admin-row"><input id="asiEmail" class="asi-admin-input" type="email" placeholder="Admin email"><button id="asiLoginBtn" class="asi-admin-btn">Continue</button></div>
          <div id="asiLoginStatus" class="asi-status"></div>
        </div>
        <div id="asiManager" class="asi-hidden">
          <div class="asi-admin-note"><b>Catalogue upload</b><br>Select a PDF catalogue. The file is stored in this browser's local IndexedDB. A public GitHub Pages upload needs a server-side upload service; no GitHub token is stored in this website.</div>
          <input id="asiCatalogueFile" class="asi-file" type="file" accept=".pdf,application/pdf">
          <div class="asi-row asi-admin-row"><button id="asiUploadBtn" class="asi-admin-btn">Save Catalogue</button><button id="asiLogoutBtn" class="asi-admin-btn secondary">Logout</button></div>
          <div id="asiUploadStatus" class="asi-status"></div>
          <div id="asiList" class="asi-list"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.asi-admin-close').onclick=()=>overlay.classList.remove('open');
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});
    const login=overlay.querySelector('#asiLogin'), manager=overlay.querySelector('#asiManager');
    function renderAuth(){
      const ok=localStorage.getItem(KEY)===ADMIN_EMAIL;
      login.classList.toggle('asi-hidden',ok); manager.classList.toggle('asi-hidden',!ok);
      if(ok) renderList();
    }
    overlay.querySelector('#asiLoginBtn').onclick=()=>{
      const email=overlay.querySelector('#asiEmail').value.trim().toLowerCase();
      const status=overlay.querySelector('#asiLoginStatus');
      if(email===ADMIN_EMAIL){localStorage.setItem(KEY,ADMIN_EMAIL);status.textContent='Admin access enabled.';renderAuth()}
      else status.textContent='Unauthorized email.';
    };
    overlay.querySelector('#asiLogoutBtn').onclick=()=>{localStorage.removeItem(KEY);renderAuth()};
    overlay.querySelector('#asiUploadBtn').onclick=async()=>{
      const input=overlay.querySelector('#asiCatalogueFile'), status=overlay.querySelector('#asiUploadStatus');
      const file=input.files[0];
      if(!file){status.textContent='Please select a PDF catalogue first.';return}
      if(file.type!=='application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){status.textContent='Only PDF catalogue files are allowed.';return}
      try{await saveFile(file);input.value='';status.textContent='Catalogue saved in this browser.';renderList()}
      catch(e){status.textContent='Could not save catalogue in this browser.'}
    };
    async function renderList(){
      const list=overlay.querySelector('#asiList'); const items=await getFiles();
      list.innerHTML=items.length?'<b>Saved catalogues</b>':'<span class="asi-small">No catalogue saved yet.</span>';
      items.forEach(item=>{
        const row=document.createElement('div'); row.className='asi-item';
        const mb=(item.size/1024/1024).toFixed(2);
        row.innerHTML=`<div><div class="asi-item-name">${item.name}</div><div class="asi-small">${mb} MB • ${new Date(item.created).toLocaleString()}</div></div><div class="asi-admin-row"><button class="asi-admin-btn" data-download="${item.id}">Download</button><button class="asi-admin-btn danger" data-delete="${item.id}">Delete</button></div>`;
        row.querySelector('[data-download]').onclick=()=>downloadFile(item);
        row.querySelector('[data-delete]').onclick=async()=>{await deleteFile(item.id);renderList()};
        list.appendChild(row);
      });
    }
    renderAuth();
  }

  function open(){build();document.getElementById('asiAdminOverlay').classList.add('open');}
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a'){e.preventDefault();open();}
    if(e.key==='Escape') document.getElementById('asiAdminOverlay')?.classList.remove('open');
  });
})();