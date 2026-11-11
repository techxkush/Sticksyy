const authConfig=window.STICKSY_SUPABASE||{};
function setAccountState(user){
  const link=document.querySelector('.account-btn,.catalog-account');if(!link||!user)return;
  const identity=user.user_metadata?.full_name||user.user_metadata?.name||user.email||user.phone||'Your account';
  const initial=identity.trim().charAt(0).toUpperCase()||'♡';
  link.textContent=initial;link.title=identity;link.setAttribute('aria-label',`Signed in as ${identity}. Open your account`);link.classList.add('is-signed-in');
}
if(authConfig.url&&authConfig.publishableKey){
  import('https://esm.sh/@supabase/supabase-js@2').then(async({createClient})=>{
    const client=createClient(authConfig.url,authConfig.publishableKey);
    const {data}=await client.auth.getSession();if(data.session?.user)setAccountState(data.session.user);
    client.auth.onAuthStateChange((_event,session)=>{if(session?.user)setAccountState(session.user)});
  }).catch(()=>{});
}
