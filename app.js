const products = [
  {id:'cartoon-chaos',name:'Bollywood Pop Culture A4 Sheet',category:'Cartoon Chaos',price:199,oldPrice:249,art:'☺ ✿ ✦ ☁ ♥ ϟ ☻ ☼ ✧',title:'BOLLYWOOD\nFAN CLUB',color:'#f6d8cf',image:'assets/bollywood-stickers.png',featured:true},
  {id:'developer-life',name:'Engineer Mode A4 Sheet',category:'Coding & Tech',price:199,oldPrice:249,art:'⌘ { } ⚡ ☕ ◉ ϟ <3 ✦',title:'ENGINEER\nENERGY',color:'#d5c9ee',image:'assets/engineer-stickers.png',featured:true},
  {id:'midnight-rider',name:'Midnight Rider A4 Sheet',category:'Automotive Culture',price:199,oldPrice:249,art:'ϟ ✦ ☾ ◉ ★ ☻ ⚡ ✧',title:'NIGHT\nDRIVE\nCLUB',color:'#d0e1cd',featured:true},
  {id:'college-survival',name:'College Survival Kit',category:'College Life',price:199,oldPrice:null,art:'✎ ☕ ✿ ☻ ✦ ☼ ♥ ☁',title:'BARELY\nMAKING\nIT',color:'#c4e0f3',featured:false},
  {id:'pastel-dreams',name:'Pastel Dreams A4 Sheet',category:'Aesthetic Dreams',price:199,oldPrice:null,art:'☾ ✿ ♡ ☁ ✧ ☼ ♥ ✦',title:'SWEET\nDAYDREAM',color:'#f5dc9f',featured:false},
  {id:'meme-therapy',name:'Meme Therapy A4 Sheet',category:'Meme Culture',price:199,oldPrice:null,art:':) ☻ ✿ ¯\\_(ツ)_/¯ ☕ ♥ ✦',title:'IT IS\nWHAT IT\nIS',color:'#f4c4d2',featured:false}
];
const icons = ['☺','✿','✦','☁','♥','ϟ','☻','☼','✧'];
const cartKey = 'sticksy-cart-v1';
let cart = JSON.parse(localStorage.getItem(cartKey)||'{}');
let coupon = '';
const money = n => `₹${n.toLocaleString('en-IN')}`;
const grid = document.querySelector('#product-grid');
const drawer = document.querySelector('.cart-drawer');
const overlay = document.querySelector('.overlay');
const toastEl = document.querySelector('.toast');
let toastTimer;

function mockSheet(p){
  if(p.image)return `<img class="product-artimg" src="${p.image}" alt="${p.name} sticker sheet" />`;
  return `<div class="mock-sheet" style="background:${p.color}"><div class="mock-title">${p.title.replaceAll('\n','<br>')}</div><div class="mock-stickers">${icons.map((x,i)=>`<i>${p.art.split(' ')[i]||x}</i>`).join('')}</div><div class="mock-foot">STICKSY CLUB · VOL. 01</div></div>`;
}
function renderProducts(filter='All',query=''){
  const shown=products.filter(p=>(filter==='All'||p.category===filter)&&(`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())));
  grid.innerHTML=shown.map(p=>`<article class="product-card reveal" data-id="${p.id}"><div class="product-visual" data-quick="${p.id}">${mockSheet(p)}${p.featured?'<span class="badge">BESTSELLER</span>':''}<button class="wishlist" aria-label="Save ${p.name}" data-wish="${p.id}">♡</button><button class="quick-trigger" data-quick="${p.id}">QUICK VIEW</button></div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><div class="product-price">${money(p.price)}${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:''}</div></div><button class="card-add" aria-label="Add ${p.name} to bag" data-add="${p.id}">+</button></article>`).join('')||'<p class="no-results">No stickers found. Try another search ✳</p>';
  observeReveals(grid.querySelectorAll('.reveal'));
}
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting)),{threshold:.12,rootMargin:'0px 0px -35px 0px'}) : null;
function observeReveals(nodes=document.querySelectorAll('.reveal')){nodes.forEach(node=>{if(revealObserver)revealObserver.observe(node);else node.classList.add('in-view')})}
function countItems(){return Object.values(cart).reduce((a,n)=>a+n,0)}
function subtotal(){return products.reduce((s,p)=>s+p.price*(cart[p.id]||0),0)}
function renderCart(){
  localStorage.setItem(cartKey,JSON.stringify(cart));
  document.querySelector('.cart-count').textContent=countItems();
  const host=document.querySelector('.cart-items');
  host.innerHTML=products.filter(p=>cart[p.id]).map(p=>`<li class="cart-item"><div class="payer-image-container">${p.image?`<img src="${p.image}" alt="" />`:`<span>${p.art.split(' ')[0]}</span>`}</div><p class="cart-line"><span class="cart-line-main"><b>${p.name}</b><small>A4 sticker sheet · ${money(p.price)} each</small></span><span class="cart-line-side"><b class="cart-item-price">${money(p.price*cart[p.id])}</b><span class="qty-control"><button aria-label="Decrease quantity" data-qty="${p.id}" data-step="-1">−</button><span>${cart[p.id]}</span><button aria-label="Increase quantity" data-qty="${p.id}" data-step="1">+</button></span><button class="remove-item" data-remove="${p.id}">Remove</button></span></p></li>`).join('');
  const isEmpty=countItems()===0;
  document.querySelector('.empty-cart').classList.toggle('visible',isEmpty);
  document.querySelector('.invoice-container').classList.toggle('is-empty',isEmpty);
  const sub=subtotal(), free=Math.max(0,399-sub);
  document.querySelector('.shipping-copy').textContent=free?`You're ${money(free)} away from FREE SHIPPING ✳`:'You unlocked FREE SHIPPING ✳';
  document.querySelector('.shipping-track span').style.width=`${Math.min(100,sub/399*100)}%`;
  const discounted=coupon==='STICK10'?Math.round(sub*.9):sub;
  const delivery=sub===0?0:sub>=399?0:49;
  document.querySelector('.invoice-items-count').textContent=`${countItems()} ${countItems()===1?'sheet':'sheets'}`;
  document.querySelector('.invoice-subtotal').textContent=money(discounted);
  document.querySelector('.invoice-shipping').textContent=isEmpty?'—':delivery===0?'FREE':money(delivery);
  document.querySelector('.invoice-total').textContent=money(discounted+delivery);
}
function showToast(text){toastEl.textContent=text;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2400)}
function addToCart(id){cart[id]=(cart[id]||0)+1;renderCart();openCart();showToast(`${products.find(p=>p.id===id).name} added to your bag ✳`)}
function openCart(){drawer.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden'}
function closeCart(){drawer.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow=''}
function quickView(id){const p=products.find(x=>x.id===id);if(!p)return;document.querySelector('.quick-content').innerHTML=`<div class="quick-image">${mockSheet(p)}</div><div class="quick-detail"><span class="product-category">${p.category}</span><h2>${p.name}</h2><div class="product-price">${money(p.price)}${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:''}</div><p>A little illustrated joy for your laptop, water bottle, journal and everywhere else. Original artwork in an A4 kiss-cut sheet format.</p><p><b>Size:</b> A4 · 8.27 × 11.69 in<br><b>Finish:</b> Protective lamination<br><b>Design:</b> Original Sticksy artwork</p><p class="fine-print">Waterproof performance has not been verified. Delivery and returns depend on the seller's shipping policy.</p><button class="button button-dark" data-add="${p.id}">ADD TO BAG <span>↗</span></button></div>`;document.querySelector('.quick-view').showModal()}
const UPI_ID='khuranakush26@oksbi',UPI_NAME='Kush Khurana';
function renderUpiStep(order){
  const orderTag=order.id.slice(0,8).toUpperCase();
  const upiUrl=`upi://pay?${new URLSearchParams({pa:UPI_ID,pn:UPI_NAME,am:Number(order.total).toFixed(2),cu:'INR',tn:`Sticksy ${orderTag}`})}`;
  sessionStorage.setItem('sticksy-current-order',JSON.stringify({id:order.id,accessToken:order.accessToken,total:order.total}));
  document.querySelector('.checkout-content').innerHTML=`<div class="eyebrow"><span></span> ORDER ${orderTag}</div><h2>PAY WITH UPI.</h2><p class="payment-lead">Scan the QR or open your UPI app. Pay the exact total below.</p><div class="payment-paybox"><img src="assets/upi-payment-qr.jpg" alt="Sticksy UPI payment QR for ${UPI_NAME}" /><div><span>PAY EXACTLY</span><b>${money(order.total)}</b><span>UPI ID</span><div class="upi-id-row"><code>${UPI_ID}</code><button type="button" class="copy-upi">COPY</button></div><a class="upi-open" href="${upiUrl}">OPEN UPI APP ↗</a></div></div><p class="payment-warning">After paying, enter the payer name and UTR from your UPI app. We’ll check the transfer before marking the order paid.</p><form class="payment-proof-form"><label>Payer name<input name="payerName" autocomplete="name" required maxlength="100" /></label><label>UTR / transaction reference<input name="utr" autocomplete="off" inputmode="text" placeholder="12-digit UTR or reference" required minlength="8" maxlength="22" pattern="[A-Za-z0-9]{8,22}" /></label><button class="button button-dark proof-submit" type="submit">SUBMIT PAYMENT DETAILS <span>↗</span></button></form><p class="payment-message" role="status" aria-live="polite"></p>`;
}
function renderPaymentSubmitted(orderTag){
  document.querySelector('.checkout-content').innerHTML=`<div class="payment-confirmed-icon">✓</div><div class="eyebrow"><span></span> ORDER ${orderTag}</div><h2>DETAILS RECEIVED.</h2><p class="payment-lead">Your UTR is waiting for manual verification. The order will show as paid only after the transfer is confirmed in the receiving UPI account.</p><div class="pending-verification"><b>Payment status: Submitted for verification</b><span>We have not marked this payment as received yet.</span></div><a class="button button-dark order-done" href="shop.html">BACK TO STICKERS <span>↗</span></a>`;
  sessionStorage.removeItem('sticksy-current-order');cart={};renderCart();
}
grid.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add){e.stopPropagation();addToCart(add.dataset.add);return}const wish=e.target.closest('[data-wish]');if(wish){wish.classList.toggle('liked');wish.textContent=wish.classList.contains('liked')?'♥':'♡';showToast(wish.classList.contains('liked')?'Saved for later ♥':'Removed from saved');return}const quick=e.target.closest('[data-quick]');if(quick)quickView(quick.dataset.quick)});
document.querySelector('.cart-items').addEventListener('click',e=>{const qty=e.target.closest('[data-qty]');const remove=e.target.closest('[data-remove]');if(qty){const id=qty.dataset.qty;cart[id]=Math.max(0,(cart[id]||0)+Number(qty.dataset.step));if(!cart[id])delete cart[id];renderCart()}if(remove){delete cart[remove.dataset.remove];renderCart()}});
document.querySelector('.cart-trigger').addEventListener('click',openCart);
document.querySelector('.close-drawer').addEventListener('click',closeCart);
drawer.addEventListener('click',e=>{if(e.target.closest('.continue-shopping'))closeCart()});
overlay.addEventListener('click',closeCart);
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelector('.filter.active').classList.remove('active');btn.classList.add('active');renderProducts(btn.dataset.filter)}));
document.querySelectorAll('.collection-card[data-category]').forEach(card=>card.addEventListener('click',()=>{const filter=document.querySelector(`.filter[data-filter="${card.dataset.category}"]`);document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));if(filter)filter.classList.add('active');renderProducts(card.dataset.category)}));
document.querySelector('.search-toggle').addEventListener('click',()=>{const q=window.prompt('Find your next favourite sticker ✳');if(q!==null){document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));document.querySelector('.filter[data-filter="All"]').classList.add('active');renderProducts('All',q);document.querySelector('#shop').scrollIntoView({behavior:'smooth'})}});
document.querySelector('.mobile-menu').addEventListener('click',e=>{const nav=document.querySelector('.main-nav');nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'))});
document.querySelector('.apply-coupon').addEventListener('click',()=>{const value=document.querySelector('.coupon-row input').value.trim().toUpperCase();const message=document.querySelector('.coupon-message');if(value==='STICK10'){coupon=value;message.textContent='10% off — nice find ✦'}else{coupon='';message.textContent=value?'That code didn’t work. Try STICK10.':''}renderCart()});
document.querySelector('.quick-view').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close()});
document.querySelector('.quick-close').addEventListener('click',()=>document.querySelector('.quick-view').close());
document.querySelector('.quick-view').addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add){addToCart(add.dataset.add);document.querySelector('.quick-view').close()}});
document.querySelector('.checkout-button').addEventListener('click',()=>{
  if(!countItems()){showToast('Your bag is empty — find a sticker first ✳');return}
  closeCart();
  let pending=null;try{pending=JSON.parse(sessionStorage.getItem('sticksy-current-order')||'null')}catch{}
  if(pending?.id&&pending?.accessToken)renderUpiStep(pending);
  else{
    const sum=subtotal(),discount=coupon==='STICK10'?Math.round(sum*.1):0,shipping=sum>=399?0:49,total=sum-discount+shipping;
    document.querySelector('.checkout-content').innerHTML=`<div class="eyebrow"><span></span> ALMOST YOURS</div><h2>DELIVERY DETAILS.</h2><form class="checkout-fields" id="checkout-details-form"><label>Full name<input name="name" autocomplete="name" required maxlength="100" /></label><label>Mobile number<input name="phone" inputmode="tel" autocomplete="tel" pattern="[0-9+ ()-]{8,20}" required /></label><label>Email address<input type="email" name="email" autocomplete="email" required maxlength="200" /></label><label>PIN code<input name="pin" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{6}" required /></label><label class="full">Address<input name="address" autocomplete="street-address" required minlength="5" /></label><label>City<input name="city" autocomplete="address-level2" required /></label><label>State<input name="state" autocomplete="address-level1" required /></label></form><div class="checkout-total"><span>${countItems()} sticker sheets · ${subtotal()>=399?'free':'₹49'} shipping</span><b>${money(total)}</b></div><p class="fine-print">You’ll see the UPI QR and exact payable amount next. Your order stays unconfirmed until payment is manually verified.</p><p class="checkout-error" role="status" aria-live="polite"></p><button class="button button-dark checkout-submit" type="button">CONTINUE TO UPI PAYMENT <span>↗</span></button>`;
  }
  document.querySelector('.checkout-modal').showModal();
});
document.querySelector('.checkout-close').addEventListener('click',()=>document.querySelector('.checkout-modal').close());
document.querySelector('.checkout-content').addEventListener('click',async e=>{
  if(e.target.closest('.copy-upi')){try{await navigator.clipboard.writeText(UPI_ID);showToast('UPI ID copied ✳')}catch{showToast(`UPI ID: ${UPI_ID}`)}return}
  if(!e.target.closest('.checkout-submit'))return;
  const form=document.querySelector('#checkout-details-form');if(!form||!form.reportValidity())return;
  const button=e.target.closest('.checkout-submit'),errorBox=document.querySelector('.checkout-error');button.disabled=true;if(errorBox)errorBox.textContent='Saving your order…';
  const values=Object.fromEntries(new FormData(form).entries());
  try{
    const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,quantity:cart[p.id]})),coupon})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save your order.');
    renderUpiStep(result);
  }catch(error){if(errorBox)errorBox.textContent=error.message;button.disabled=false}
});
document.querySelector('.checkout-content').addEventListener('submit',async e=>{
  if(!e.target.matches('.payment-proof-form'))return;e.preventDefault();
  const button=e.target.querySelector('.proof-submit'),message=document.querySelector('.payment-message');button.disabled=true;message.textContent='Submitting your payment reference…';
  let order=null;try{order=JSON.parse(sessionStorage.getItem('sticksy-current-order')||'null')}catch{}
  if(!order?.id||!order?.accessToken){message.textContent='This payment session has expired. Please open checkout from your bag again.';button.disabled=false;return}
  const orderTag=order.id.slice(0,8).toUpperCase(),values=Object.fromEntries(new FormData(e.target).entries());
  try{const response=await fetch(`/api/orders/${encodeURIComponent(order.id)}/payment`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,accessToken:order.accessToken})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not submit payment details.');renderPaymentSubmitted(orderTag)}
  catch(error){message.textContent=error.message;button.disabled=false}
});
document.querySelector('.newsletter-form').addEventListener('submit',e=>{e.preventDefault();showToast('Thanks for your interest! Newsletter signup needs a mailing-list connection.');e.currentTarget.reset()});
document.querySelectorAll('.section-heading,.collection-card,.manifesto-art,.manifesto-copy,.custom-banner>div,.custom-banner>.button,.newsletter>div,.newsletter-form').forEach(node=>node.classList.add('reveal'));
observeReveals();renderProducts();renderCart();
if(new URLSearchParams(location.search).get('cart')==='open')openCart();
