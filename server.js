const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const attempts = new Map();
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

const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'localhost';let url;
  try{url=new URL(req.url,`http://${host}`)}catch{return send(res,400,'Bad request')}
  const pathname=url.pathname;
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
});
