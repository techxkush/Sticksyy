const themeGroups={
  girls:{heading:'GIRLY STICKER THEMES',copy:'A little collection of pretty, playful designs for whatever you’re personalising.',doodle:'✿',tiles:[
    {category:'Aesthetic Dreams',title:'Pastel daydreams',copy:'Soft colours and little everyday magic.',icon:'☾',label:'SOFT · DREAMY'},
    {category:'Cartoon Chaos',title:'Pop culture cuties',copy:'A little fan energy with a playful twist.',icon:'☺',label:'FANS · FUN'},
    {category:'College Life',title:'Campus cuteness',copy:'Make the study kit a little more you.',icon:'✎',label:'NOTES · NIGHTS'},
    {category:'Meme Culture',title:'Meme mood',copy:'For the jokes only your group chat gets.',icon:'♥',label:'INTERNET · ENERGY'}
  ]},
  boys:{heading:'BOYS’ STICKER THEMES',copy:'Bold little designs for the gear, gadgets, and everyday things you carry.',doodle:'ϟ',tiles:[
    {category:'Coding & Tech',title:'Code & tech',copy:'For keyboards, laptops, and late-night builds.',icon:'⌘',label:'CODE · CREATE'},
    {category:'Automotive Culture',title:'Auto culture',copy:'For the ones who love a good drive.',icon:'ϟ',label:'GEARS · GO'},
    {category:'Cartoon Chaos',title:'Pop culture',copy:'Fan favourites with a playful edge.',icon:'✦',label:'FANS · FUN'},
    {category:'Meme Culture',title:'Meme mode',copy:'A reaction image, but make it a sticker.',icon:':)',label:'MEMES · MOOD'}
  ]}
};
const audience=new URLSearchParams(location.search).get('audience')==='boys'?'boys':'girls';
const group=themeGroups[audience];
document.body.classList.add(audience==='boys'?'for-boys':'for-girls');
document.querySelector('#theme-heading').innerHTML=`${group.heading.replace(' STICKER',' STICKER<br />')} <em>${group.doodle}</em>`;
document.querySelector('#theme-copy').textContent=group.copy;
document.querySelector('#theme-doodle').textContent=group.doodle;
document.querySelectorAll('.theme-switches a').forEach(link=>link.classList.toggle('active',link.dataset.audience===audience));
document.querySelector('#theme-grid').innerHTML=group.tiles.map((tile,index)=>`<a class="theme-tile" href="shop.html?category=${encodeURIComponent(tile.category)}"><span class="tile-kicker">${tile.label}</span><div><h3>${tile.title}</h3><p>${tile.copy}</p></div><span class="tile-art" aria-hidden="true">${tile.icon}</span><span class="tile-arrow">↗</span></a>`).join('');
try{const cart=JSON.parse(localStorage.getItem('sticksy-cart-v1')||'{}');document.querySelector('.cart-count').textContent=Object.values(cart).reduce((sum,value)=>sum+(Number(value)||0),0)}catch{}
document.querySelector('.mobile-menu').addEventListener('click',event=>{const nav=document.querySelector('.main-nav');nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'))});
