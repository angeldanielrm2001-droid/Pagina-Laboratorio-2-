/* Artesanías El Olivo · interfaz de demostración (datos en localStorage, sin servidor) */
const WA='https://wa.me/50300000000'; // reemplazar por un número real
const API_URL='https://script.google.com/macros/s/AKfycbxfw-oRUeUXyuw6tdUYHODrZM-Cmej9Pvb-ZzE4zFsuy1pexhapg5RdXF1oOLe6ug73/exec'; 
const api=(action,data)=>{if(!API_URL)return;fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,data})}).then(r=>r.json()).then(r=>{if(!r.ok)throw r.error}).catch(()=>toast('No se pudo guardar en la hoja de cálculo'))};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem('olv_'+k))??d}catch{return d}},S=(k,v)=>localStorage.setItem('olv_'+k,JSON.stringify(v));
const CATS=['Comedores','Repisas','Decoración','Negocios'],TONE={Cedro:'#C99A6B',Pino:'#E6D0A3',Caoba:'#9A5B45'};
const ICO={Comedores:'<path d="M8 22h44M14 22v26M46 22v26M20 22v8M40 22v8"/>',Repisas:'<path d="M10 12v40M50 12v40M10 22h40M10 36h40M10 50h40"/>',Decoración:'<path d="M24 10h12M26 10c0 8-10 10-10 24a14 14 0 0 0 28 0c0-14-10-16-10-24"/>',Negocios:'<path d="M10 24h40M14 24v26M46 24v26M10 38h40"/>'};
const ico=c=>`<svg viewBox="0 0 60 60" aria-hidden="true">${ICO[c]}</svg>`;
const STEPS=['Recibida','En revisión','Presupuesto enviado','Pedido confirmado'];
let sess=L('sess',null),favs=L('favs',[]),log=L('log',[]),qprod=null;
let prods=L('prods',Array.from({length:8},(_,i)=>({id:i+1,cat:CATS[i%4],wood:['Cedro','Pino','Caoba'][i%3],price:[90,140,220,310,60,180,420,260][i]})));
let quotes=L('quotes',[{folio:'OLV-1001',name:'Cliente de ejemplo',email:'cliente@olivo.sv',desc:'Información',state:1}]);
let tests=L('tests',[{id:1,t:'Información',ok:1},{id:2,t:'Información',ok:1},{id:3,t:'Información',ok:1},{id:4,t:'Información (pendiente de aprobación)',ok:0}]);
const flt={q:'',cat:'',wood:'',max:500};
const save=()=>{S('favs',favs);S('prods',prods);S('quotes',quotes);S('tests',tests);S('log',log)};
const now=()=>new Date().toLocaleString('es-SV');
const note=m=>{const f=now();log.unshift(f+' · '+m);log=log.slice(0,30);save();api('addLog',{fecha:f,accion:m})};
const setState=(q,s)=>{q.state=s;save();api('updateQuote',{folio:q.folio,estado:s})};
/* Lee la hoja de cálculo y actualiza la pantalla actual */
async function sync(){
  if(!API_URL)return;
  try{const r=await(await fetch(API_URL)).json();
    prods=r.productos.map(x=>({id:+x.id,cat:x.categoria,wood:x.madera,price:+x.precio}));
    quotes=r.cotizaciones.map(x=>({folio:x.folio,name:x.nombre,email:x.correo,desc:x.descripcion,state:+x.estado}));
    tests=r.opiniones.map(x=>({id:+x.id,t:x.texto,ok:+x.aprobada}));
    log=r.bitacora.map(x=>x.fecha+' · '+x.accion).reverse().slice(0,30);
    save();VIEWS[(location.hash.slice(1)||'inicio').split('/')[0]]?.();
  }catch(e){toast('Sin conexión con la hoja de cálculo; usando datos locales')}
}
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2800)};
const go=h=>{location.hash=h};
const card=p=>`<article class="card"><a href="#ficha/${p.id}" class="ph" style="--t:${TONE[p.wood]}" aria-label="Ver ficha">${ico(p.cat)}</a><h3>Información</h3><span class="chip">${p.cat}</span><span class="chip">${p.wood}</span><span class="chip">$${p.price}</span><button class="fav" data-f="${p.id}" aria-pressed="${favs.includes(p.id)}" aria-label="Guardar en favoritos">♥</button></article>`;

/* ---------- Vistas ---------- */
function home(){
  $('#feat').innerHTML=prods.slice(0,3).map(card).join('');
  $('#cats').innerHTML=CATS.map(c=>`<a href="#catalogo" data-cat="${c}"><svg viewBox="0 0 60 60" aria-hidden="true">${ICO[c]}</svg>${c}</a>`).join('');
  $('#testi').innerHTML=tests.filter(x=>x.ok).map(x=>`<article class="panel"><p>${x.t}</p><span class="badge">Cliente verificado</span></article>`).join('');
}
function cat(){
  const f=$('#flt');f.q.value=flt.q;f.cat.value=flt.cat;f.wood.value=flt.wood;f.max.value=flt.max;$('#pout').textContent=flt.max;
  const r=prods.filter(p=>(!flt.q||('información '+p.cat+' '+p.wood).toLowerCase().includes(flt.q.toLowerCase()))&&(!flt.cat||p.cat==flt.cat)&&(!flt.wood||p.wood==flt.wood)&&p.price<=flt.max);
  $('#rcount').textContent=r.length?`${r.length} producto(s)`:'';
  $('#empty').hidden=!!r.length;
  $('#grid').innerHTML=(r.length?r:prods.slice(0,3)).map(card).join(''); // sin resultados: sugerir similares
}
function ficha(){
  const p=prods.find(x=>x.id==location.hash.split('/')[1]);if(!p)return go('catalogo');
  $('#fichac').innerHTML=`<div class="ficha"><div><div class="ph big" id="fmain" style="--t:${TONE[p.wood]}">${ico(p.cat)}</div>
  <div class="thumbs">${[0,1,2,3].map(i=>`<button class="ph" style="--t:${TONE[p.wood]}" ${i?'':'aria-current="true"'} data-th="${i}" aria-label="Imagen ${i+1}">${ico(p.cat)}</button>`).join('')}</div></div>
  <div><h1>Información</h1><span class="chip">${p.cat}</span><span class="chip">${p.wood}</span><p class="lead">$${p.price} · Información</p><p>Información</p>
  <div class="acts"><button class="btn ghost" data-pdf>Descargar PDF</button><button class="btn ghost fav-b" data-f="${p.id}" aria-pressed="${favs.includes(p.id)}">${favs.includes(p.id)?'Quitar de favoritos':'Favorito'}</button><button class="btn" data-q="${p.id}">Cotizar</button><a class="btn ghost wa-link" target="_blank" rel="noopener" href="${WA}">WhatsApp</a></div></div></div>`;
}
function cot(){
  const f=$('#qf');if(!$('#qres').hidden){newQuote();return} // si ya se envió una solicitud, muestra el formulario limpio
  $('#qauto').hidden=!sess;
  if(sess){f.email.value=sess.email;f.name.value=f.name.value||sess.email.split('@')[0]}
  const p=prods.find(x=>x.id==qprod);$('#qprod').hidden=!p;if(p)$('#qprod').textContent=`Producto precargado: Información (${p.cat}, ${p.wood}, $${p.price})`;
}
const track=q=>`<ol class="track">${STEPS.map((s,i)=>`<li class="${i<=q.state?'done':''}">${s}</li>`).join('')}</ol>`;
function offer(q){
  const b=$('#qoffer');if(!b)return;
  b.innerHTML=track(q)+(q.state==1?'<button class="btn ghost" id="qsim">Simular presupuesto del taller</button>':q.state==2?'<div class="panel"><h3>Presupuesto recibido</h3><p>Información</p><button class="btn" id="qok">Aceptar presupuesto</button> <button class="btn ghost" id="qadj">Pedir ajuste</button></div>':'<p class="note">Pedido confirmado. El taller se pondrá en contacto contigo.</p>');
}
function cli(){
  $('#cfav').innerHTML=favs.length?favs.map(id=>prods.find(p=>p.id==id)).filter(Boolean).map(card).join(''):'<p class="muted">Aún no tienes favoritos. Explora el <a href="#catalogo">catálogo</a>.</p>';
  $('#cq').innerHTML=quotes.filter(q=>q.email==sess?.email||q.folio=='OLV-1001').map(q=>`<div class="panel"><b>${q.folio}</b>${track(q)}</div>`).join('');
}
function adm(){
  const t=$('#atabs .on').dataset.t;['p','q','c','r'].forEach(k=>$('#a'+k).hidden=k!=t);
  $('#ap').innerHTML=`<form id="pf" class="filters"><input type="hidden" name="id"><label>Categoría<select name="cat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Madera<select name="wood"><option>Cedro</option><option>Pino</option><option>Caoba</option></select></label><label>Precio<input name="price" type="number" min="1" value="100"></label><button class="btn">Guardar producto</button></form>
  <table><tr><th>Producto</th><th>Categoría</th><th>Madera</th><th>Precio</th><th></th></tr>${prods.map(p=>`<tr><td>Información</td><td>${p.cat}</td><td>${p.wood}</td><td>$${p.price}</td><td><button class="btn ghost sm" data-ed="${p.id}">Editar</button> <button class="btn ghost sm" data-del="${p.id}">Eliminar</button></td></tr>`).join('')}</table>`;
  $('#aq').innerHTML='<div class="rows">'+quotes.map(q=>`<div class="row"><span><b>${q.folio}</b> ${q.name}</span><span class="chip">${STEPS[q.state]}</span>${q.state<2?`<button class="btn sm" data-resp="${q.folio}">Responder con presupuesto</button>`:''}</div>`).join('')+'</div>';
  $('#ac').innerHTML='<div class="rows">'+tests.map((x,i)=>`<div class="row"><span>${x.t}</span><span class="chip">${x.ok?'Publicado':'Pendiente'}</span><span>${x.ok?'':`<button class="btn sm" data-ok="${i}">Aprobar</button> `}<button class="btn ghost sm" data-rm="${i}">Quitar</button></span></div>`).join('')+'</div>';
  $('#blog').innerHTML=log.slice(0,8).map(l=>`<li>${l}</li>`).join('')||'<li>Sin actividad</li>';
}
function head(){$('#ses').textContent=sess?'Mi panel':'Ingresar';const o=$('#out');if(o)o.hidden=!sess;$$('.wa-link').forEach(a=>a.href=WA)}
const VIEWS={inicio:home,catalogo:cat,ficha,cotizacion:cot,cliente:cli,admin:adm};
function show(){
  let v=(location.hash.slice(1)||'inicio').split('/')[0];if(!$('#v-'+v))v='inicio';
  if(v=='cliente'&&!sess){toast('Inicia sesión para ver tu panel');v='login'}
  if(v=='admin'&&sess?.role!='admin'){toast('Área solo para administradores');v='login'}
  $$('.view').forEach(e=>e.hidden=e.id!='v-'+v);
  $$('#nav a').forEach(a=>a.toggleAttribute('aria-current',a.hash=='#'+v));
  VIEWS[v]?.();head();scrollTo(0,0);if(v=='admin'||v=='cliente')sync();
}
addEventListener('hashchange',show);

/* ---------- Eventos globales ---------- */
const fail=(f,k,m)=>{const e=f[k];e.classList.add('bad');e.nextElementSibling.textContent=m};
const clean=f=>{$$('.bad',f).forEach(e=>e.classList.remove('bad'));$$('.err',f).forEach(e=>e.textContent='')};
document.addEventListener('click',e=>{
  const t=e.target.closest('button,a');if(!t)return;
  if(t.dataset.f){ // favorito (requiere sesión)
    if(!sess){toast('Inicia sesión para guardar favoritos');return go('login')}
    const id=+t.dataset.f;favs=favs.includes(id)?favs.filter(x=>x!=id):[...favs,id];save();toast(favs.includes(id)?'Añadido a favoritos':'Quitado de favoritos');show();
  }
  if(t.dataset.cat){flt.cat=t.dataset.cat}
  if(t.dataset.th!=null){$$('[data-th]').forEach(b=>b.toggleAttribute('aria-current',b==t));$('#fmain').style.opacity=.5;setTimeout(()=>$('#fmain').style.opacity=1,150)}
  if(t.dataset.pdf!=null||t.dataset.x=='pdf'){toast('Generando PDF…');setTimeout(()=>toast('Descarga lista'),900);if(t.dataset.x)note('Reporte PDF exportado')}
  if(t.dataset.q){qprod=+t.dataset.q;go('cotizacion')}
  if(t.dataset.gal!=null){$('#lbi').innerHTML=ico(CATS[t.dataset.gal%4]);$('#lb').showModal()}
  if(t.id=='lbx')$('#lb').close();
  if(t.closest('#faqt')&&t.dataset.c!=null){$$('#faqt button').forEach(b=>b.classList.toggle('on',b==t));$$('#faq details').forEach(d=>d.hidden=t.dataset.c&&d.dataset.c!=t.dataset.c)}
  if(t.closest('#atabs')&&t.dataset.t){$$('#atabs button').forEach(b=>b.classList.toggle('on',b==t));adm()}
  if(t.dataset.ed){const p=prods.find(x=>x.id==t.dataset.ed),f=$('#pf');f.id.value=p.id;f.cat.value=p.cat;f.wood.value=p.wood;f.price.value=p.price;f.scrollIntoView()}
  if(t.dataset.del&&confirm('¿Eliminar este producto?')){prods=prods.filter(p=>p.id!=t.dataset.del);api('deleteProduct',{id:+t.dataset.del});note('Producto eliminado');adm()}
  if(t.dataset.resp){setState(quotes.find(q=>q.folio==t.dataset.resp),2);note('Presupuesto enviado: '+t.dataset.resp);toast('Presupuesto enviado al cliente');adm()}
  if(t.dataset.ok!=null){tests[t.dataset.ok].ok=1;save();api('updateTestimonial',{id:tests[t.dataset.ok].id,aprobada:1});note('Opinión aprobada');adm()}
  if(t.dataset.rm!=null){const[x]=tests.splice(t.dataset.rm,1);save();api('deleteTestimonial',{id:x.id});note('Opinión retirada');adm()}
  if(t.dataset.x=='xls'){ // CSV que abre en Excel
    const csv='Folio,Nombre,Correo,Estado\n'+quotes.map(q=>[q.folio,q.name,q.email,STEPS[q.state]].join(',')).join('\n');
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'})),download:'cotizaciones.csv'});a.click();note('Reporte Excel exportado');toast('Descarga lista')}
  const q=quotes.find(x=>x.folio==window.curQ);
  if(t.id=='qsim'){setState(q,2);offer(q)}
  if(t.id=='qok'){setState(q,3);offer(q);toast('Pedido confirmado')}
  if(t.id=='qadj'){setState(q,1);offer(q);toast('Ajuste solicitado. El taller enviará una nueva propuesta')}
  if(t.id=='lretry'){$('#lerr').hidden=true;$('#lf').pass.focus()}
  if(t.id=='lrec'){$('#rf').hidden=false;$('#rf').email.focus()}
  if(t.id=='lguest'){sess=null;S('sess',null);go('inicio')}
  if(t.id=='aout'||t.id=='out'){note('Sesión cerrada');sess=null;S('sess',null);toast('Sesión cerrada');go('inicio');show()}
});
$('#ses').onclick=()=>go(sess?(sess.role=='admin'?'admin':'cliente'):'login');
$('#sq').onsubmit=e=>{e.preventDefault();flt.q=e.target.firstElementChild.value;go('catalogo');if(location.hash=='#catalogo')cat()};
$('#flt').oninput=e=>{const f=e.currentTarget;Object.assign(flt,{q:f.q.value,cat:f.cat.value,wood:f.wood.value,max:+f.max.value});$('#pout').textContent=flt.max;const y=scrollY;cat();scrollTo(0,y)};
$('#fclr').onclick=()=>{Object.assign(flt,{q:'',cat:'',wood:'',max:500});cat()};
$('#gal').innerHTML=Array.from({length:6},(_,i)=>`<button class="ph" style="--t:${Object.values(TONE)[i%3]}" data-gal="${i}" aria-label="Ampliar imagen ${i+1}">${ico(CATS[i%4])}</button>`).join('');
$('#qf').pics.onchange=e=>$('#pnames').textContent=[...e.target.files].map(f=>f.name).join(', ');

/* ---------- Formularios ---------- */
const mail=v=>/^\S+@\S+\.\S+$/.test(v);
$('#lf').onsubmit=e=>{e.preventDefault();const f=e.target;
  if(!mail(f.email.value)||f.pass.value.length<4){$('#lerr').hidden=false;return}
  $('#lerr').hidden=true;sess={email:f.email.value,role:/admin/i.test(f.email.value)?'admin':'cliente'};S('sess',sess);
  if(sess.role=='admin')note('Inicio de sesión de administrador');toast('Bienvenido');go(sess.role=='admin'?'admin':'cliente')};
$('#rf').onsubmit=e=>{e.preventDefault();if(!mail(e.target.email.value))return toast('Escribe un correo válido');toast('Enlace seguro enviado a '+e.target.email.value);e.target.hidden=true};
function newQuote(){ // vuelve a mostrar el formulario vacío
  const f=$('#qf');f.reset();f.style.display='';f.querySelector('[type=submit]').disabled=false;delete f.dataset.busy;
  $('#qres').hidden=true;$('#pnames').textContent='';cot();scrollTo(0,0);
}
$('#qf').onsubmit=e=>{e.preventDefault();const f=e.target;if(f.dataset.busy)return;clean(f);let ok=1;
  if(!f.name.value.trim()){fail(f,'name','Escribe tu nombre');ok=0}
  if(!mail(f.email.value)){fail(f,'email','Escribe un correo válido');ok=0}
  if(f.desc.value.trim().length<5){fail(f,'desc','Describe tu proyecto (mínimo 5 caracteres)');ok=0}
  if(!ok)return;
  f.dataset.busy=1;f.querySelector('[type=submit]').disabled=true; // evita envíos duplicados
  const q={folio:'OLV-'+(Math.max(1000,...quotes.map(x=>+String(x.folio).slice(4)||0))+1),name:f.name.value,email:f.email.value,desc:f.desc.value,state:0};quotes.push(q);
  api('addQuote',{folio:q.folio,fecha:now(),nombre:q.name,correo:q.email,descripcion:q.desc,medidas:f.size.value,madera:f.wood.value,producto_id:qprod||'',estado:0});window.curQ=q.folio;note('Nueva solicitud '+q.folio);
  f.style.display='none';const r=$('#qres');r.hidden=false;
  r.innerHTML=`<div class="note" role="status"><b>✓ Solicitud enviada.</b> Tu número de folio es <b>${q.folio}</b>.</div><ul class="ticks"><li>Confirmación en pantalla</li><li>Copia enviada a ${q.email}</li><li>Aviso al taller</li></ul><div id="qoffer"></div><p><button class="btn ghost" type="button" onclick="newQuote()">Hacer otra solicitud</button></p>`;
  toast('Solicitud enviada. Tu folio es '+q.folio);scrollTo(0,0);
  $$('.ticks li',r).forEach((li,i)=>setTimeout(()=>li.classList.add('on'),400*(i+1)));
  setTimeout(()=>{setState(q,1);offer(q)},1500);save();qprod=null};
$('#cf').onsubmit=e=>{e.preventDefault();const f=e.target;clean(f);let ok=1;
  if(!f.name.value.trim()){fail(f,'name','Escribe tu nombre');ok=0}
  if(!mail(f.email.value)){fail(f,'email','Escribe un correo válido');ok=0}
  if(!f.msg.value.trim()){fail(f,'msg','Escribe tu mensaje');ok=0}
  if(ok){api('addContact',{fecha:now(),nombre:f.name.value,correo:f.email.value,mensaje:f.msg.value});toast('Mensaje enviado. Recibirás una confirmación por correo');f.reset()}};
$('#of').onsubmit=e=>{e.preventDefault();const o={id:Date.now(),t:e.target.t.value,ok:0};tests.push(o);save();api('addTestimonial',{id:o.id,texto:o.t,aprobada:0});e.target.reset();toast('Gracias. Tu opinión será publicada tras la aprobación')};
document.addEventListener('submit',e=>{if(e.target.getAttribute('id')!='pf')return;e.preventDefault();const f=e.target,d={cat:f.cat.value,wood:f.wood.value,price:+f.price.value};
  let pr;if(f.id.value){pr=prods.find(p=>p.id==f.id.value);Object.assign(pr,d);note('Producto editado')}else{pr={id:Math.max(0,...prods.map(p=>p.id))+1,...d};prods.push(pr);note('Producto creado')}
  save();api('saveProduct',{id:pr.id,categoria:pr.cat,madera:pr.wood,precio:pr.price});
  toast('Producto guardado');adm()});
show();sync();
