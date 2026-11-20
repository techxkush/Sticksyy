const config=window.STICKSY_SUPABASE||{};
const message=document.querySelector('#auth-message');
const emailForm=document.querySelector('#email-form');
let supabase=null;
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
emailForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!emailForm.reportValidity())return;const button=emailForm.querySelector('[type="submit"]');button.disabled=true;showMessage('Signing in…','success');
  try{const client=await getClient();const {data,error}=await client.auth.signInWithPassword({email:emailForm.elements.email.value.trim(),password:emailForm.elements.password.value});if(error)throw error;if(data.user)displaySession(data.user)}catch(error){showMessage(error.message)}finally{button.disabled=false}
});
document.querySelector('#email-sign-up').addEventListener('click',async event=>{
  if(!emailForm.reportValidity())return;const button=event.currentTarget;button.disabled=true;showMessage('Creating your account…','success');
  try{const client=await getClient();const {data,error}=await client.auth.signUp({email:emailForm.elements.email.value.trim(),password:emailForm.elements.password.value});if(error)throw error;if(data.session&&data.user)displaySession(data.user);else showMessage('Account created. Check your email to confirm it before logging in.','success')}catch(error){showMessage(error.message)}finally{button.disabled=false}
});document.querySelector('#sign-out').addEventListener('click',async event=>{try{const client=await getClient();const {error}=await client.auth.signOut();if(error)throw error;document.querySelector('#signed-in-view').hidden=true;document.querySelector('#signed-out-view').hidden=false;showMessage('You’re signed out. See you again soon ✳','success')}catch(error){showMessage(error.message)}});
if(!configured)showMessage('Sign-in will be active after connecting a Supabase project.','info');
loadSession();



