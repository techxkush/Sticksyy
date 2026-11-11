document.querySelector('#admin-date').textContent=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium'}).format(new Date());
const list=document.querySelector('#orders-list');
const statusNames={awaiting_payment:'Awaiting payment details',submitted:'UTR submitted · verify transfer',verified:'Payment verified',rejected:'Payment not matched'};
const rupees=value=>`₹${Number(value||0).toLocaleString('en-IN')}`;
function make(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function renderOrder(order){
  const card=make('article','admin-order');
  const head=make('div','admin-order-head');
  const title=make('div');title.append(make('h3',null,`Order ${order.id.slice(0,8).toUpperCase()}`),make('small',null,new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(order.created_at))));
  const badge=make('span',`order-status status-${order.payment_status}`,statusNames[order.payment_status]||order.payment_status);head.append(title,badge);card.append(head);
  const customer=make('div','order-customer');customer.append(make('b',null,order.customer_name),make('span',null,`${order.phone} · ${order.email}`),make('span',null,`${order.shipping_address}, ${order.city}, ${order.state} ${order.pincode}`));card.append(customer);
  const items=make('ul','order-items');for(const item of order.items||[]){items.append(make('li',null,`${item.name} × ${item.quantity} · ${rupees(item.line_total)}`))}card.append(items);
  const payment=make('div','order-payment');payment.append(make('strong',null,`Total ${rupees(order.total)}`),make('span',null,order.payer_name?`Payer: ${order.payer_name}`:'Payer name not submitted'),make('code',null,order.utr?`UTR: ${order.utr}`:'UTR not submitted'));card.append(payment);
  if(order.payment_status==='submitted'){
+    const actions=make('div','order-actions');const verify=make('button','verify-payment','Confirm transfer received');verify.type='button';verify.addEventListener('click',()=>updatePayment(order.id,'verified'));const reject=make('button','reject-payment','Mark not received');reject.type='button';reject.addEventListener('click',()=>updatePayment(order.id,'rejected'));actions.append(verify,reject);card.append(actions);
+  }
+  return card;
+}
+async function loadOrders(){
+  const notice=document.querySelector('#orders-message');notice.textContent='Loading orders…';list.replaceChildren();
+  try{const response=await fetch('/api/admin/orders',{cache:'no-store'});const result=await response.json();if(response.status===401){location.href='/admin/login';return}if(!response.ok)throw new Error(result.error||'Could not load orders.');const orders=result.orders||[];document.querySelector('#orders-count').textContent=orders.length;document.querySelector('#orders-count').classList.toggle('unavailable',!orders.length);const verified=orders.filter(order=>order.payment_status==='verified');document.querySelector('#verified-revenue').textContent=rupees(verified.reduce((sum,order)=>sum+Number(order.total||0),0));document.querySelector('#verified-revenue').classList.toggle('unavailable',!verified.length);document.querySelector('#orders-summary').textContent=`${orders.length} saved · ${verified.length} payment${verified.length===1?'':'s'} verified`;notice.textContent=orders.length?'Newest orders first. Verify UTRs in your UPI app before confirming.':'No orders yet. Submitted orders will appear here.';for(const order of orders)list.append(renderOrder(order))}
+  catch(error){notice.textContent=error.message;document.querySelector('#orders-count').textContent='—';document.querySelector('#verified-revenue').textContent='—'}
+}
+async function updatePayment(id,paymentStatus){
+  const phrase=paymentStatus==='verified'?'confirm that this UPI transfer is visible in your account':'mark this transfer as not received';if(!window.confirm(`Please check your bank/UPI app first. Do you want to ${phrase}?`))return;
+  try{const response=await fetch(`/api/admin/orders/${encodeURIComponent(id)}/payment`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentStatus})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not update this order.');await loadOrders()}
+  catch(error){document.querySelector('#orders-message').textContent=error.message}
+}
+document.querySelector('#refresh-orders').addEventListener('click',loadOrders);
+loadOrders();
