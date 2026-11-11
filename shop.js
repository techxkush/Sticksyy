const catalogProducts = [
  {id:'cartoon-chaos',name:'Bollywood Pop Culture A4 Sheet',category:'Cartoon Chaos',price:199,oldPrice:249,art:'☺ ✿ ✦ ☁ ♥ ϟ ☻ ☼ ✧',title:'BOLLYWOOD FAN CLUB',image:'assets/bollywood-stickers.png',tone:'pink',badge:'BESTSELLER'},
  {id:'developer-life',name:'Engineer Mode A4 Sheet',category:'Coding & Tech',price:199,oldPrice:249,art:'⌘ { } ⚡ ☕ ◉ ϟ <3 ✦',title:'ENGINEER ENERGY',image:'assets/engineer-stickers.png',tone:'lav',badge:'BESTSELLER'},
  {id:'midnight-rider',name:'Midnight Rider A4 Sheet',category:'Automotive Culture',price:199,oldPrice:249,art:'ϟ ✦ ☾ ◉ ★ ☻ ⚡ ✧',title:'NIGHT DRIVE CLUB',tone:'green'},
  {id:'college-survival',name:'College Survival Kit',category:'College Life',price:199,art:'✎ ☕ ✿ ☻ ✦ ☼ ♥ ☁',title:'BARELY MAKING IT',tone:'blue'},
  {id:'pastel-dreams',name:'Pastel Dreams A4 Sheet',category:'Aesthetic Dreams',price:199,art:'☾ ✿ ♡ ☁ ✧ ☼ ♥ ✦',title:'SWEET DAYDREAM',tone:'yellow'},
  {id:'meme-therapy',name:'Meme Therapy A4 Sheet',category:'Meme Culture',price:199,art:":) ☻ ✿ ¯\\_(ツ)_/¯ ☕ ♥ ✦",title:'IT IS WHAT IT IS',tone:'coral'}
];
const stickerGrid=document.querySelector('#sticker-grid');
const toast=document.querySelector('.shop-toast');
let activeFilter='All',searchTerm='',toastTimer;
const cash=value=>`₹${value.toLocaleString('en-IN')}`;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function stickerArt(product,dialog=false){
  if(product.image)return `<img class="product" src="${product.image}" alt="${escapeHTML(product.name)} sticker sheet" />`;
  const art=product.art.split(' ');
  const words=product.title.split(/\s+/),mid=Math.ceil(words.length/2),title=words.length>2?`${words.slice(0,mid).join(' ')}<br />${words.slice(mid).join(' ')}`:escapeHTML(product.title);
  return `<div class="product mini-sheet${dialog?' dialog-mini':''}"><div class="mini-title">${title}</div><div class="mini-tiles">${Array.from({length:9},(_,i)=>`<i>${escapeHTML(art[i]||'✦')}</i>`).join('')}</div><div class="mini-foot">STICKSY CLUB · VOL. 01</div></div>`;
}
function shownProducts(){return catalogProducts.filter(product=>(activeFilter==='All'||product.category===activeFilter)&&`${product.name} ${product.category}`.toLowerCase().includes(searchTerm))}
function renderCatalog(){
  const items=shownProducts();
  stickerGrid.innerHTML=items.length?items.map((product,index)=>`<article class="sticker-item reveal" data-product="${product.id}"><div class="box sticker-card tone-${product.tone}" data-tilt data-detail="${product.id}" tabindex="0" role="button" aria-label="View ${escapeHTML(product.name)} details">${product.badge?`<span class="tag">${product.badge}</span>`:''}<h2 class="name">${escapeHTML(product.name)}</h2><div class="circle"></div>${stickerArt(product)}<button class="buy" type="button" data-add="${product.id}">ADD TO BAG · ${cash(product.price)}</button></div><div class="product-meta"><div><h2>${escapeHTML(product.name)}</h2><p>${escapeHTML(product.category)} · A4 sticker sheet</p></div><span class="product-price-shop">${cash(product.price)}${product.oldPrice?`<del>${cash(product.oldPrice)}</del>`:''}</span></div><button class="mobile-add" type="button" data-add="${product.id}">ADD TO BAG +</button></article>`).join(''):'<p class="no-stickers">No stickers found. Try another little search ✳</p>';
  document.querySelector('.result-count').textContent=`${items.length} ${items.length===1?'good thing':'good things'}`;
  if(window.VanillaTilt)window.VanillaTilt.init(stickerGrid.querySelectorAll('.sticker-card'),{max:15,speed:300,easing:'cubic-bezier(.03,.98,.52,.99)',scale:1.025,glare:true,'max-glare':.12});
  else stickerGrid.querySelectorAll('.sticker-card').forEach(setupTiltFallback);
  observeCards(stickerGrid.querySelectorAll('.reveal'));
}
const cardObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting)),{threshold:.1,rootMargin:'0px 0px -25px 0px'}):null;
function observeCards(cards){cards.forEach(card=>cardObserver?cardObserver.observe(card):card.classList.add('in-view'))}
function setupTiltFallback(card){
  card.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;card.style.transform=`perspective(900px) rotateX(${(0.5-y)*14}deg) rotateY(${(x-0.5)*14}deg) scale(1.025)`});
  card.addEventListener('pointerleave',()=>card.style.transform='');
}
function readCart(){try{return JSON.parse(localStorage.getItem('sticksy-cart-v1')||'{}')}catch{return {}}}
function updateBagCount(){const cart=readCart(),count=Object.values(cart).reduce((sum,value)=>sum+(Number(value)||0),0);document.querySelector('.cart-count').textContent=count}
function showShopToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2400)}
function addProduct(id){const product=catalogProducts.find(item=>item.id===id);if(!product)return;const cart=readCart();cart[id]=(Number(cart[id])||0)+1;localStorage.setItem('sticksy-cart-v1',JSON.stringify(cart));updateBagCount();showShopToast(`${product.name} added to your bag ✳`)}
function openProductDialog(id){const product=catalogProducts.find(item=>item.id===id);if(!product)return;document.querySelector('.dialog-content').innerHTML=`<div class="dialog-art">${stickerArt(product,true)}</div><div class="dialog-copy"><div class="eyebrow"><span></span> ${escapeHTML(product.category)}</div><h2>${escapeHTML(product.name)}</h2><p class="dialog-price">${cash(product.price)}${product.oldPrice?` <del>${cash(product.oldPrice)}</del>`:''}</p><p>A little illustrated joy for laptops, water bottles, journals, and wherever you want to add a bit of you.</p><p><b>Sheet size:</b> A4 · 8.27 × 11.69 inches<br /><b>Finish:</b> Protective lamination<br /><b>Design:</b> Original Sticksy artwork</p><p class="fine-print">Waterproof performance has not been verified.</p><button class="dialog-add" data-add="${product.id}">ADD TO BAG · ${cash(product.price)}</button></div>`;document.querySelector('.sticker-dialog').showModal()}
stickerGrid.addEventListener('click',event=>{const add=event.target.closest('[data-add]');if(add){event.stopPropagation();addProduct(add.dataset.add);return}const detail=event.target.closest('[data-detail]');if(detail)openProductDialog(detail.dataset.detail)});
stickerGrid.addEventListener('keydown',event=>{if(event.target.closest('[data-add]'))return;const card=event.target.closest('[data-detail]');if(card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openProductDialog(card.dataset.detail)}});
document.querySelector('.dialog-content').addEventListener('click',event=>{const add=event.target.closest('[data-add]');if(add){addProduct(add.dataset.add);document.querySelector('.sticker-dialog').close()}});
document.querySelector('.dialog-close').addEventListener('click',()=>document.querySelector('.sticker-dialog').close());
document.querySelector('.sticker-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close()});
document.querySelectorAll('.catalog-filter').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.catalog-filter.active')?.classList.remove('active');button.classList.add('active');activeFilter=button.dataset.filter;renderCatalog()}));
document.querySelector('.catalog-search input').addEventListener('input',event=>{searchTerm=event.currentTarget.value.trim().toLowerCase();renderCatalog()});
document.querySelector('.mode-switch').addEventListener('click',event=>{const dark=document.body.classList.toggle('is-dark');event.currentTarget.classList.toggle('active',dark);localStorage.setItem('sticksy-shop-theme',dark?'dark':'light')});
document.querySelector('.mobile-menu').addEventListener('click',event=>{const nav=document.querySelector('.main-nav');nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'))});
const savedTheme=localStorage.getItem('sticksy-shop-theme');if(savedTheme==='dark'){document.body.classList.add('is-dark');document.querySelector('.mode-switch').classList.add('active')}
const requestedCategory=new URLSearchParams(location.search).get('category');
if(catalogProducts.some(product=>product.category===requestedCategory)){activeFilter=requestedCategory;document.querySelectorAll('.catalog-filter').forEach(button=>button.classList.toggle('active',button.dataset.filter===activeFilter))}
renderCatalog();updateBagCount();
