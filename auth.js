const config=window.STICKSY_SUPABASE||{};
const message=document.querySelector('#auth-message');
const phoneForm=document.querySelector('#phone-form');
const otpForm=document.querySelector('#otp-form');
const otpInput=document.querySelector('#otp-code');
const phoneInput=document.querySelector('#phone-number');
let supabase=null,phoneForOtp='';
const configured=Boolean(config.url&&config.publishableKey);
function showMessage(text,kind='error'){message.textContent=text;message.classList.toggle('success',kind==='success')}
async function getClient(){
  if(!configured)throw new Error('Sign-in is not connected yet. Add your Supabase Project URL and public key in supabase-config.js.');
  if(!supabase){const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');supabase=createClient(config.url,config.publishableKey)}
  return supabase;
}
function displaySession(user){
  if(!user)return;
  document.querySelector('#signed-out-view').hidden=true;
  document.querySelector('#signed-in-view').hidden=false;
  const identity=user.email||user.phone||'Sticksy member';
  const display=user.user_metadata?.full_name||user.user_metadata?.name||identity.split('@')[0]||'friend';
  document.querySelector('#customer-name').textContent=display.split(' ')[0];
  document.querySelector('#customer-identity').textContent=identity;
}
async function loadSession(){if(!configured)return;try{const client=await getClient();const {data}=await client.auth.getSession();if(data.session?.user)displaySession(data.session.user);client.auth.onAuthStateChange((_event,session)=>{if(session?.user)displaySession(session.user)})}catch(error){showMessage(error.message)}}
document.querySelector('#google-sign-in').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;showMessage('Opening Google sign-in…','success');
  try{const client=await getClient();const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('index.html',window.location.href).href}});if(error)throw error}
  catch(error){showMessage(error.message);button.disabled=false}
});
phoneForm.addEventListener('submit',async event=>{
  event.preventDefault();const phone=phoneInput.value.trim();
  if(!/^\+[1-9]\d{7,14}$/.test(phone)){showMessage('Include your country code, like +91 98765 43210.');phoneInput.focus();return}
  const button=phoneForm.querySelector('button[type="submit"]');button.disabled=true;showMessage('Sending your one-time code…','success');
  try{const client=await getClient();const {error}=await client.auth.signInWithOtp({phone});if(error)throw error;phoneForOtp=phone;phoneForm.hidden=true;otpForm.hidden=false;showMessage(`Code sent to ${phone}. It may take a moment to arrive.`,'success');otpInput.focus()}
  catch(error){showMessage(error.message);button.disabled=false}
});
otpForm.addEventListener('submit',async event=>{
  event.preventDefault();const token=otpInput.value.replace(/\D/g,'');if(token.length!==6){showMessage('Enter the 6-digit code from your text message.');return}
  const button=otpForm.querySelector('button[type="submit"]');button.disabled=true;showMessage('Checking your code…','success');
  try{const client=await getClient();const {data,error}=await client.auth.verifyOtp({phone:phoneForOtp,token,type:'sms'});if(error)throw error;if(data.user)displaySession(data.user)}
  catch(error){showMessage(error.message);button.disabled=false}
});
document.querySelector('#change-number').addEventListener('click',()=>{otpForm.hidden=true;phoneForm.hidden=false;otpInput.value='';showMessage('');phoneInput.focus()});
document.querySelector('#sign-out').addEventListener('click',async event=>{try{const client=await getClient();const {error}=await client.auth.signOut();if(error)throw error;document.querySelector('#signed-in-view').hidden=true;document.querySelector('#signed-out-view').hidden=false;showMessage('You’re signed out. See you again soon ✳','success')}catch(error){showMessage(error.message)}});
if(!configured)showMessage('Sign-in will be active after connecting a Supabase project.','info');
loadSession();
