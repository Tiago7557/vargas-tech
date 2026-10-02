/* Interacciones locales del catálogo académico Vargas Tech. */
(() => {
  'use strict';
  const products = window.PRODUCTS;
  const money = n => new Intl.NumberFormat('es-PE', {style:'currency', currency:'PEN'}).format(n);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const image = p => `assets/img/${p.image}.svg`;
  const card = p => `<article class="product-card"><a class="product-image" href="shop-single.html?id=${p.id}" aria-label="Ver ${escape(p.name)}"><img src="${image(p)}" alt="Ilustración de ${escape(p.name)}" loading="lazy"></a><span class="product-category">${p.category}</span><h3><a href="shop-single.html?id=${p.id}">${p.name}</a></h3><p class="product-desc">${p.desc}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" type="button" data-add="${p.id}" aria-label="Agregar ${escape(p.name)} a mi selección">+</button></div></article>`;
  const featured = document.querySelector('#featured-products');
  if (featured) featured.innerHTML = products.slice(0,4).map(card).join('');
  const catalog = document.querySelector('#catalog-products');
  if (catalog) {
    const params = new URLSearchParams(location.search);
    let category = ['Computación','Audio','Accesorios'].includes(params.get('categoria')) ? params.get('categoria') : 'Todos';
    const search = document.querySelector('#search'), sort = document.querySelector('#sort');
    search.value = params.get('q') || '';
    const render = () => {
      let results = products.filter(p => (category === 'Todos' || p.category === category) && norm(`${p.name} ${p.category} ${p.desc}`).includes(norm(search.value)));
      if (sort.value === 'asc') results.sort((a,b) => a.price-b.price);
      if (sort.value === 'desc') results.sort((a,b) => b.price-a.price);
      if (sort.value === 'name') results.sort((a,b) => a.name.localeCompare(b.name,'es'));
      catalog.innerHTML = results.map(card).join('');
      document.querySelector('#result-count').textContent = `${results.length} ${results.length === 1 ? 'producto' : 'productos'}`;
      document.querySelector('#empty-results').hidden = results.length > 0;
      document.querySelectorAll('[data-category]').forEach(b => { const active = b.dataset.category === category; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
    };
    search.addEventListener('input',render); sort.addEventListener('change',render);
    document.querySelectorAll('[data-category]').forEach(b => b.addEventListener('click',() => {category=b.dataset.category;render();}));
    document.querySelector('#clear-filters').addEventListener('click',() => {category='Todos';search.value='';sort.value='featured';render();search.focus();});
    render();
  }
  const detail = document.querySelector('#product-detail');
  if (detail) {
    const p = products.find(p => p.id === new URLSearchParams(location.search).get('id'));
    if (p) {
      document.title = `${p.name} | Vargas Tech`;
      detail.innerHTML = `<div class="detail-grid"><div class="detail-image"><img src="${image(p)}" alt="Ilustración de ${p.name}"></div><div class="detail-copy"><span class="eyebrow">${p.category} / ${p.tag}</span><h1>${p.name}</h1><p>${p.desc}</p><div class="detail-price">${money(p.price)}</div><ul class="spec-list">${p.specs.map(s=>`<li>${s}</li>`).join('')}</ul><div class="detail-actions"><div><label for="detail-qty">Cantidad</label><input id="detail-qty" type="number" value="1" min="1" max="99" step="1" required></div><button type="button" class="button primary" data-add="${p.id}" data-detail-add>Agregar a mi selección +</button></div><p class="small-note">Producto ficticio. Precio y características de demostración. Sin venta real.</p></div></div>`;
      document.querySelector('#related-products').innerHTML = products.filter(x=>x.id!==p.id).sort((a,b)=>Number(b.category===p.category)-Number(a.category===p.category)).slice(0,4).map(card).join('');
    } else {
      detail.innerHTML = '<div class="empty-state"><h1>Producto no encontrado.</h1><p>Elige un producto desde nuestro catálogo.</p><a class="button primary" href="shop.html">Explorar catálogo</a></div>';
      document.querySelector('.related-section').hidden = true;
    }
  }
  const key = 'vargas-tech-cart-v1';
  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) {
      const quantities = new Map();
      saved.forEach(x=>{if(x && products.some(p=>p.id===x.id) && Number.isInteger(x.qty) && x.qty>0) quantities.set(x.id,Math.min(99,(quantities.get(x.id)||0)+x.qty));});
      cart = [...quantities].map(([id,qty])=>({id,qty}));
    }
  } catch { /* Un navegador sin almacenamiento sigue permitiendo la sesión actual. */ }
  const dialog = document.querySelector('#cart-dialog');
  let toastTimer;
  function toast(message) {const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);}
  function renderCart() {
    document.querySelectorAll('.cart-count').forEach(el=>el.textContent=cart.reduce((n,x)=>n+x.qty,0));
    document.querySelector('#cart-items').innerHTML = cart.length ? cart.map(x=>{
      const p=products.find(p=>p.id===x.id);
      return `<div class="cart-item"><img src="${image(p)}" alt="${p.name}"><div><h3>${p.name}</h3><p>${money(p.price)} por unidad · ${money(p.price*x.qty)}</p><div class="cart-controls"><button type="button" data-change="${p.id}" data-delta="-1" aria-label="Reducir cantidad de ${p.name}" ${x.qty===1?'disabled':''}>−</button><span aria-label="Cantidad">${x.qty}</span><button type="button" data-change="${p.id}" data-delta="1" aria-label="Aumentar cantidad de ${p.name}" ${x.qty===99?'disabled':''}>+</button><button type="button" data-remove="${p.id}" aria-label="Quitar ${p.name}">Quitar</button></div></div></div>`;
    }).join('') : '<p class="cart-empty">Tu selección está vacía. <a href="shop.html">Explora el catálogo</a> para comenzar.</p>';
    document.querySelector('#cart-total').textContent = money(cart.reduce((sum,x)=>sum+products.find(p=>p.id===x.id).price*x.qty,0));
    document.querySelector('#download-quote').disabled = !cart.length;
  }
  function save() {try {localStorage.setItem(key,JSON.stringify(cart));}catch {toast('Tu navegador no permite guardar la selección después de cerrar esta página.');}renderCart();}
  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-add]');
    if(add){
      let qty=1;
      if(add.hasAttribute('data-detail-add')) {const input=document.querySelector('#detail-qty');if(!input.reportValidity())return;qty=Number(input.value);}
      const existing=cart.find(x=>x.id===add.dataset.add);
      if((existing?.qty||0)+qty>99){toast('Puedes seleccionar hasta 99 unidades por producto.');return;}
      if(existing)existing.qty+=qty;else cart.push({id:add.dataset.add,qty});save();toast('Producto agregado a tu selección.');
    }
    if(e.target.closest('[data-open-cart]')) {renderCart();dialog.showModal();}
    if(e.target.closest('[data-close-cart]'))dialog.close();
    const change=e.target.closest('[data-change]');
    if(change){const x=cart.find(x=>x.id===change.dataset.change);if(x){x.qty=Math.max(1,Math.min(99,x.qty+Number(change.dataset.delta)));save(); const replacement=dialog.querySelector(`[data-change="${change.dataset.change}"][data-delta="${change.dataset.delta}"]`); if(replacement&&!replacement.disabled)replacement.focus();}}
    const remove=e.target.closest('[data-remove]');
    if(remove){cart=cart.filter(x=>x.id!==remove.dataset.remove);save();dialog.querySelector('[data-close-cart]').focus();}
  });
  function download(filename,text) {const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.querySelector('#download-quote').addEventListener('click',()=>{
    if(!cart.length)return;
    const lines=cart.map(x=>{const p=products.find(p=>p.id===x.id);return `${x.qty} x ${p.name} | ${money(p.price)} c/u | Subtotal: ${money(p.price*x.qty)}`;});
    const total=cart.reduce((sum,x)=>sum+products.find(p=>p.id===x.id).price*x.qty,0);
    download('vargas-tech-cotizacion.txt',`VARGAS TECH — COTIZACIÓN DE DEMOSTRACIÓN\nFecha: ${new Date().toLocaleString('es-PE')}\n\n${lines.join('\n')}\n\nTotal referencial: ${money(total)}\n\nProyecto académico de Tiago Vargas. Productos y precios ficticios.\nEste documento no es un pedido, comprobante ni compromiso de venta.\nNo se ha enviado información a una tienda.`);
  });
  const form=document.querySelector('#contact-form');
  if(form)form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const values=new FormData(form);download('vargas-tech-consulta.txt',`VARGAS TECH — CONSULTA DE DEMOSTRACIÓN\n\nNombre: ${values.get('name')}\nCorreo: ${values.get('email')}\nTema: ${values.get('subject')}\n\n${values.get('message')}\n\nArchivo generado localmente. No se ha enviado esta consulta.`);document.querySelector('#form-status').textContent='Se generó el archivo de consulta para descargar. No se envió ningún mensaje.';});
  renderCart();
})();
