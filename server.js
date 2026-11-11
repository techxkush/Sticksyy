const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const attempts = new Map();
const orderRequests = new Map();
const proofRequests = new Map();
const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE = 'sticksy_admin_session';

function loadLocalEnv(){
  const envPath=path.join(root,'.env.local');
  if(!fs.existsSync(envPath))return;
  for(const line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){
    const trimmed=line.trim();if(!trimmed||trimmed.startsWith('#'))continue;
    const split=trimmed.indexOf('=');if(split<1)continue;
    const key=trimmed.slice(0,split).trim().replace(/^\uFEFF/,''),value=trimmed.slice(split+1).trim();
    if(!process.env[key])process.env[key]=value;
  }
}
loadLocalEnv();

function safeEqual(input,expected){
  const left=crypto.createHash('sha256').update(String(input||'')).digest();
  const right=crypto.createHash('sha256').update(String(expected||'')).digest();
  return crypto.timingSafeEqual(left,right);
}
function cookieValue(header,name){
  const entry=(header||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`));
  if(!entry)return '';
  try{return decodeURIComponent(entry.slice(name.length+1))}catch{return ''}
}
function validSession(req){
  const token=cookieValue(req.headers.cookie,COOKIE),entry=sessions.get(token);
  if(!entry)return false;
  if(entry.expires<Date.now()){sessions.delete(token);return false}
  entry.expires=Date.now()+SESSION_MS;
  return true;
}
function setCookie(res,token,maxAge){
  const secure=process.env.NODE_ENV==='production'?'; Secure':'';
  res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
}
function send(res,status,body,headers={}){
  res.writeHead(status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...headers});res.end(body);
}
function redirect(res,location){res.writeHead(303,{Location:location,'Cache-Control':'no-store'});res.end()}
function readBody(req){return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>8192){reject(new Error('Request too large'));req.destroy()}});req.on('end',()=>resolve(new URLSearchParams(body)))})}
function readJsonBody(req){return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>32768){reject(new Error('Request too large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(body||'{}'))}catch{reject(new Error('Invalid JSON'))}})})}
function json(res,status,data){return send(res,status,JSON.stringify(data),{'Content-Type':'application/json; charset=utf-8'})}
function dbReady(){return Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY)}
async function dbRequest(resource,options={}){
  if(!dbReady())throw new Error('Supabase server database key is not configured');
  const base=process.env.SUPABASE_URL.replace(/\/$/,'');
  const key=process.env.SUPABASE_SECRET_KEY;
  const response=await fetch(`${base}/rest/v1/${resource}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(options.headers||{})}});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{}
  return {ok:response.ok,status:response.status,data};
}
async function safeDbRequest(resource,options={}){try{return await dbRequest(resource,options)}catch{return {ok:false,status:503,data:null}}}
const catalog={
  'cartoon-chaos':{name:'Bollywood Pop Culture A4 Sheet',price:199},
  'developer-life':{name:'Engineer Mode A4 Sheet',price:199},
  'midnight-rider':{name:'Midnight Rider A4 Sheet',price:199},
  'college-survival':{name:'College Survival Kit',price:199},
  'pastel-dreams':{name:'Pastel Dreams A4 Sheet',price:199},
  'meme-therapy':{name:'Meme Therapy A4 Sheet',price:199}
};
function serveFile(res,filePath,status=200){
  if(!fs.existsSync(filePath)||!fs.statSync(filePath).isFile())return send(res,404,'Not found');
  const ext=path.extname(filePath).toLowerCase();
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/markdown; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
  res.writeHead(status,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':filePath.endsWith('admin.html')?'no-store':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});
  fs.createReadStream(filePath).pipe(res);
}
function staticPath(urlPath){
  let decoded;try{decoded=decodeURIComponent(urlPath)}catch{return null}
  if(decoded.includes('\0')||decoded.includes('\\'))return null;
  const relative=decoded==='/'?'index.html':decoded.replace(/^\/+/, '');
  const resolved=path.resolve(root,relative);
  if(!resolved.startsWith(root+path.sep))return null;
  if(relative.split('/').some(part=>part.startsWith('.')))return null;
  return resolved;
}
function failureKey(req){return req.socket.remoteAddress||'unknown'}
function rateAllowed(map,key,max,windowMs){const now=Date.now(),entry=map.get(key)||{count:0,reset:now+windowMs};if(entry.reset<=now){entry.count=0;entry.reset=now+windowMs}if(entry.count>=max){map.set(key,entry);return false}entry.count++;map.set(key,entry);return true}

const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'localhost';let url;
  try{url=new URL(req.url,`http://${host}`)}catch{return send(res,400,'Bad request')}
  const pathname=url.pathname;
  if(pathname==='/api/orders'&&req.method==='POST'){
    if(!dbReady())return json(res,503,{error:'Order storage is not configured yet. Add the Supabase server secret and run the orders SQL setup.'});
    if(!rateAllowed(orderRequests,failureKey(req),10,15*60*1000))return json(res,429,{error:'Too many checkout attempts. Please wait a little and try again.'});
    let body;try{body=await readJsonBody(req)}catch{return json(res,400,{error:'Please review the checkout details and try again.'})}
    const name=String(body.name||'').trim(),phone=String(body.phone||'').trim(),email=String(body.email||'').trim();
    const address=String(body.address||'').trim(),city=String(body.city||'').trim(),state=String(body.state||'').trim(),pin=String(body.pin||'').trim();
    if(name.length<2||name.length>100||phone.length<8||phone.length>20||!/^\S+@\S+\.\S+$/.test(email)||address.length<5||city.length<2||state.length<2||!/^\d{6}$/.test(pin))return json(res,400,{error:'Please fill in all delivery details, including a valid email and 6-digit PIN code.'});
    if(!Array.isArray(body.items)||!body.items.length||body.items.length>12)return json(res,400,{error:'Your cart is empty or has too many different designs.'});
    const items=[];let itemCount=0;
    for(const line of body.items){const product=catalog[line.id],quantity=Number(line.quantity);if(!product||!Number.isInteger(quantity)||quantity<1||quantity>20)return json(res,400,{error:'One of the cart items is invalid. Please refresh your cart.'});itemCount+=quantity;items.push({id:line.id,name:product.name,quantity,unit_price:product.price,line_total:product.price*quantity})}
    if(itemCount>30)return json(res,400,{error:'Please limit each order to 30 sheets.'});
    const subtotal=items.reduce((sum,item)=>sum+item.line_total,0),discount=String(body.coupon||'').toUpperCase()==='STICK10'?Math.round(subtotal*.1):0,shipping=subtotal>=399?0:49,total=subtotal-discount+shipping;
    const accessToken=crypto.randomBytes(32).toString('base64url'),accessHash=crypto.createHash('sha256').update(accessToken).digest('hex');
    const created=await safeDbRequest('orders',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({customer_name:name,phone,email,shipping_address:address,city,state,pincode:pin,items,subtotal,discount,shipping,total,payment_status:'awaiting_payment',order_status:'awaiting_payment',access_token_hash:accessHash})});
    const order=Array.isArray(created.data)?created.data[0]:null;
    if(!created.ok||!order)return json(res,502,{error:'Could not save the order right now. Please try again in a moment.'});
    return json(res,201,{id:order.id,total:order.total,subtotal:order.subtotal,discount:order.discount,shipping:order.shipping,accessToken});
  }
  const paymentMatch=pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/payment$/i);
  if(paymentMatch&&req.method==='POST'){
    if(!dbReady())return json(res,503,{error:'Order storage is not configured yet.'});
    if(!rateAllowed(proofRequests,failureKey(req),20,15*60*1000))return json(res,429,{error:'Too many payment submissions. Please wait a little and try again.'});
    let body;try{body=await readJsonBody(req)}catch{return json(res,400,{error:'Invalid payment details.'})}
    const payerName=String(body.payerName||'').trim(),utr=String(body.utr||'').trim().toUpperCase(),token=String(body.accessToken||'');
    if(payerName.length<2||payerName.length>100||!/^[A-Z0-9]{8,22}$/.test(utr)||token.length<30)return json(res,400,{error:'Enter the payer name and a valid UTR or transaction reference.'});
    const tokenHash=crypto.createHash('sha256').update(token).digest('hex');
    const filter=new URLSearchParams({id:`eq.${paymentMatch[1]}`,access_token_hash:`eq.${tokenHash}`,payment_status:'eq.awaiting_payment'}).toString();
    const updated=await safeDbRequest(`orders?${filter}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payer_name:payerName,utr,payment_status:'submitted',payment_submitted_at:new Date().toISOString()})});
    if(!updated.ok)return json(res,updated.status===409?409:502,{error:updated.status===409?'That UTR was already submitted.':'Could not submit payment details. Please try again.'});
    if(!Array.isArray(updated.data)||!updated.data.length)return json(res,409,{error:'This order is no longer awaiting payment, or the order link is invalid.'});
    return json(res,200,{status:'submitted',message:'Payment details received. We’ll verify the UPI transfer before confirming the order.'});
  }
  if(pathname==='/api/admin/orders'&&req.method==='GET'){
    if(!validSession(req))return json(res,401,{error:'Admin sign-in required.'});
    if(!dbReady())return json(res,503,{error:'Order database is not configured yet.'});
    const result=await safeDbRequest('orders?select=id,created_at,customer_name,phone,email,shipping_address,city,state,pincode,items,subtotal,discount,shipping,total,payment_status,order_status,payer_name,utr,payment_submitted_at,verified_at&order=created_at.desc&limit=100');
    if(!result.ok)return json(res,502,{error:'Could not load orders.'});
    return json(res,200,{orders:result.data||[]});
  }
  const adminOrderMatch=pathname.match(/^\/api\/admin\/orders\/([0-9a-f-]{36})\/payment$/i);
  if(adminOrderMatch&&req.method==='PATCH'){
    if(!validSession(req))return json(res,401,{error:'Admin sign-in required.'});
    if(!dbReady())return json(res,503,{error:'Order database is not configured yet.'});
    const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==host)return json(res,403,{error:'Forbidden'})}catch{return json(res,403,{error:'Forbidden'})}}
    let body;try{body=await readJsonBody(req)}catch{return json(res,400,{error:'Invalid status.'})}
    if(!['verified','rejected'].includes(body.paymentStatus))return json(res,400,{error:'Choose a valid payment status.'});
    const fields=body.paymentStatus==='verified'?{payment_status:'verified',order_status:'paid',verified_at:new Date().toISOString()}:{payment_status:'rejected',order_status:'payment_issue',verified_at:null};
    const result=await safeDbRequest(`orders?id=eq.${adminOrderMatch[1]}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
    if(!result.ok||!Array.isArray(result.data)||!result.data.length)return json(res,502,{error:'Could not update this order.'});
    return json(res,200,{order:result.data[0]});
  }
  if(pathname==='/admin'||pathname==='/admin/'){
    if(!validSession(req))return redirect(res,'/admin/login');
    return serveFile(res,path.join(root,'admin.html'));
  }
  if(pathname==='/admin/login'&&req.method==='GET'){
    if(validSession(req))return redirect(res,'/admin');
    return serveFile(res,path.join(root,'admin-login.html'));
  }
  if(pathname==='/admin/login'&&req.method==='POST'){
    const origin=req.headers.origin;
    if(origin){try{if(new URL(origin).host!==host)return send(res,403,'Forbidden')}catch{return send(res,403,'Forbidden')}}
    const key=failureKey(req),record=attempts.get(key)||{count:0,reset:Date.now()+15*60*1000};
    if(record.reset<Date.now()){record.count=0;record.reset=Date.now()+15*60*1000}
    if(record.count>=8)return send(res,429,'Too many attempts. Please wait 15 minutes and try again.');
    let body;try{body=await readBody(req)}catch{return send(res,413,'Request too large')}
    const expectedUser=process.env.STICKSY_ADMIN_USERNAME||'',expectedPass=process.env.STICKSY_ADMIN_PASSWORD||'';
    const ok=Boolean(expectedUser&&expectedPass)&&safeEqual(body.get('username'),expectedUser)&&safeEqual(body.get('password'),expectedPass);
    if(!ok){record.count++;attempts.set(key,record);return redirect(res,'/admin/login?error=1')}
    attempts.delete(key);
    const token=crypto.randomBytes(32).toString('base64url');sessions.set(token,{expires:Date.now()+SESSION_MS});
    setCookie(res,token,Math.floor(SESSION_MS/1000));return redirect(res,'/admin');
  }
  if(pathname==='/admin/logout'&&req.method==='POST'){
    const origin=req.headers.origin;
    if(origin){try{if(new URL(origin).host!==host)return send(res,403,'Forbidden')}catch{return send(res,403,'Forbidden')}}
    const token=cookieValue(req.headers.cookie,COOKIE);sessions.delete(token);setCookie(res,'',0);return redirect(res,'/admin/login');
  }
  if(pathname==='/admin.html'||pathname==='/admin-login.html')return send(res,404,'Not found');
  if(pathname.startsWith('/admin/'))return send(res,404,'Not found');
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method not allowed',{Allow:'GET, HEAD'});
  const file=staticPath(pathname);if(!file)return send(res,404,'Not found');
  serveFile(res,file);
});

server.listen(port,'127.0.0.1',()=>{
  console.log(`Sticksy available at http://127.0.0.1:${port}`);
  console.log('Admin route: http://127.0.0.1:'+port+'/admin');
  if(!process.env.STICKSY_ADMIN_USERNAME||!process.env.STICKSY_ADMIN_PASSWORD)console.warn('Admin credentials are not configured. Set STICKSY_ADMIN_USERNAME and STICKSY_ADMIN_PASSWORD in .env.local.');
  if(!dbReady())console.warn('UPI order storage is not configured. Run supabase/orders.sql and set SUPABASE_SECRET_KEY in .env.local.');
});
