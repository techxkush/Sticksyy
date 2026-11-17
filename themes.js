const themeGroups={
  girls:{heading:'GIRLY STICKER THEMES',copy:'A little collection of pretty, playful designs for whatever you’re personalising.',doodle:'✿',tiles:[
    {category:'Aesthetic Dreams',title:'Pastel daydreams',copy:'Soft colours and little everyday magic.',icon:'☾',label:'SOFT · DREAMY'},
    {category:'Coding & Tech',title:'Girls who build',copy:'Tech, coffee, and big ideas in pink.',icon:'⌘',label:'CODE · CREATE'},
    {category:'Automotive Culture',title:'Scooter girl era',copy:'Cute rides, bold colours, your own rules.',icon:'🛵',label:'RIDE · REPEAT'},
    {category:'Music & Fandom',title:'Music & fandom',copy:'Little keepsakes for your current obsession.',icon:'🎧',label:'FANS · FEELS'}
  ]},
  boys:{heading:'BOYS’ STICKER THEMES',copy:'Bold little designs for the gear, gadgets, and everyday things you carry.',doodle:'ϟ',tiles:[
    {category:'Automotive Culture',title:'Racing & rides',copy:'Speed-inspired art for your everyday gear.',icon:'🏁',label:'GEARS · GO'},
    {category:'Sports & Fitness',title:'Cricket & gym',copy:'For match days, training days, and rest days.',icon:'🏏',label:'PLAY · TRAIN'},
    {category:'Coding & Tech',title:'Tech heads',copy:'Laptop art and clever little details.',icon:'⌘',label:'CODE · CREATE'},
    {category:'Music & Fandom',title:'Fan favourites',copy:'Keep the music and fandom close.',icon:'🎵',label:'FANS · FEELS'}
  ]}
};
const audience=new URLSearchParams(location.search).get('audience')==='boys'?'boys':'girls';
const group=themeGroups[audience];
document.body.classList.add(audience==='boys'?'for-boys':'for-girls');
document.querySelector('#theme-heading').innerHTML=`${group.heading.replace(' STICKER',' STICKER<br />')} <em>${group.doodle}</em>`;
document.querySelector('#theme-copy').textContent=group.copy;
document.querySelector('#theme-doodle').textContent=group.doodle;
document.querySelectorAll('.theme-switches a').forEach(link=>link.classList.toggle('active',link.dataset.audience===audience));
document.querySelector('#theme-grid').innerHTML=group.tiles.map(tile=>`<a class="theme-tile" href="shop.html?audience=${audience}&category=${encodeURIComponent(tile.category)}"><span class="tile-kicker">${tile.label}</span><div><h3>${tile.title}</h3><p>${tile.copy}</p></div><span class="tile-art" aria-hidden="true">${tile.icon}</span><span class="tile-arrow">↗</span></a>`).join('');
try{const cart=JSON.parse(localStorage.getItem('sticksy-cart-v1')||'{}');document.querySelector('.cart-count').textContent=Object.values(cart).reduce((sum,value)=>sum+(Number(value)||0),0)}catch{}
document.querySelector('.mobile-menu').addEventListener('click',event=>{const nav=document.querySelector('.main-nav');nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'))});
