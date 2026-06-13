import { useState } from 'react';
import { FileText, Plus, Trash2, Download, Edit2, Check, Clock, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem { id:string; desc:string; qty:number; rate:number; }
interface Invoice {
  id:string; number:string; client:string; clientEmail:string; clientAddress:string;
  date:string; due:string; items:LineItem[]; notes:string; status:'draft'|'sent'|'paid'|'overdue';
  createdAt:number;
}

const ACCENT='#10b981'; const BG='#080f0a';
const SAVE_KEY='ip_invoices_v1';
const load=():Invoice[]=>{ try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'[]')}catch{return []} };
const persist=(items:Invoice[])=>localStorage.setItem(SAVE_KEY,JSON.stringify(items));

export default function App() {
  const [invoices,setInvoices]=useState<Invoice[]>(load);
  const [view,setView]=useState<'list'|'create'|'edit'>('list');
  const [current,setCurrent]=useState<Invoice|null>(null);

  const saveInv=(inv:Invoice)=>{
    const updated=invoices.find(i=>i.id===inv.id)?invoices.map(i=>i.id===inv.id?inv:i):[inv,...invoices];
    setInvoices(updated); persist(updated); setView('list');
  };

  const totals = invoices.reduce((s,i)=>({
    total:s.total+i.items.reduce((x,it)=>x+it.qty*it.rate,0),
    paid:s.paid+(i.status==='paid'?i.items.reduce((x,it)=>x+it.qty*it.rate,0):0),
    pending:s.pending+(i.status!=='paid'?i.items.reduce((x,it)=>x+it.qty*it.rate,0):0),
  }),{total:0,paid:0,pending:0});

  const exportInvoice=(inv:Invoice)=>{
    const total=inv.items.reduce((s,i)=>s+i.qty*i.rate,0);
    const win=window.open('','_blank');
    if(!win)return;
    win.document.write(`<html><head><title>Invoice ${inv.number}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,-apple-system,sans-serif;padding:48px;color:#111;max-width:700px;margin:0 auto}h1{font-size:32px;font-weight:700;color:#10b981;margin-bottom:4px}.meta{display:flex;justify-content:space-between;margin:24px 0;gap:24px}.block{flex:1}.label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}.val{font-size:14px;color:#111;line-height:1.5}table{width:100%;border-collapse:collapse;margin:24px 0}th{text-align:left;padding:8px 12px;background:#f9fafb;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase}td{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px}.total-row{font-weight:700;font-size:15px;color:#10b981}.status{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}@media print{body{padding:20px}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:32px">
      <div><h1>INVOICE</h1><div style="color:#9ca3af;font-size:13px">#${inv.number}</div></div>
      <div style="text-align:right"><div class="label">Status</div><span class="status" style="background:${inv.status==='paid'?'#10b98120':'#f59e0b20'};color:${inv.status==='paid'?'#10b981':'#f59e0b'}">${inv.status.toUpperCase()}</span></div>
    </div>
    <div class="meta">
      <div class="block"><div class="label">Bill To</div><div class="val"><strong>${inv.client}</strong><br>${inv.clientEmail}<br>${inv.clientAddress}</div></div>
      <div class="block" style="text-align:right"><div class="label">Invoice Date</div><div class="val">${inv.date}</div><div class="label" style="margin-top:12px">Due Date</div><div class="val">${inv.due}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${inv.items.map(it=>`<tr><td>${it.desc}</td><td style="text-align:right">${it.qty}</td><td style="text-align:right">$${it.rate.toFixed(2)}</td><td style="text-align:right">$${(it.qty*it.rate).toFixed(2)}</td></tr>`).join('')}
    <tr class="total-row"><td colspan="3" style="text-align:right;padding:12px">Total</td><td style="text-align:right;padding:12px">$${total.toFixed(2)}</td></tr>
    </tbody></table>
    ${inv.notes?`<div style="margin-top:16px;padding:14px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280">${inv.notes}</div>`:''}
    </body></html>`);
    win.document.close(); setTimeout(()=>win.print(),500);
  };

  if(view==='create'||view==='edit') return <InvoiceForm invoice={current} onSave={saveInv} onBack={()=>setView('list')}/>;

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid #052e1c',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px #10b98130'}}><FileText size={16} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'16px',color:'white',lineHeight:1}}>InvoicePro</div>
          <div style={{fontSize:'11px',color:'#065f46',marginTop:'2px'}}>{invoices.length} invoices</div></div>
        </div>
        <button onClick={()=>{setCurrent(null);setView('create');}} style={{display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',background:ACCENT,border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 12px #10b98130'}}>
          <Plus size={13}/> New Invoice
        </button>
      </header>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        {invoices.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
          {[{l:'Total Invoiced',v:`$${totals.total.toFixed(0)}`,c:'#10b981'},{l:'Paid',v:`$${totals.paid.toFixed(0)}`,c:'#34d399'},{l:'Pending',v:`$${totals.pending.toFixed(0)}`,c:'#f59e0b'}].map(s=>(
            <div key={s.l} style={{background:'#0a1a0e',border:'1px solid #052e1c',borderRadius:'10px',padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:'16px',fontWeight:'700',color:s.c}}>{s.v}</div>
              <div style={{fontSize:'10px',color:'#065f46',marginTop:'2px'}}>{s.l}</div>
            </div>
          ))}
        </div>}
        {invoices.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:'52px',marginBottom:'16px'}}>📄</div>
            <h3 style={{fontSize:'20px',fontWeight:'700',color:'white',marginBottom:'8px'}}>No invoices yet</h3>
            <p style={{color:'#065f46',fontSize:'14px',marginBottom:'24px',lineHeight:'1.6',maxWidth:'240px',margin:'0 auto 24px'}}>Create your first professional invoice in seconds.</p>
            <button onClick={()=>{setCurrent(null);setView('create');}} style={{padding:'12px 24px',borderRadius:'10px',background:ACCENT,border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 16px #10b98130'}}>Create first invoice</button>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {[...invoices].sort((a,b)=>b.createdAt-a.createdAt).map(inv=>{
              const total=inv.items.reduce((s,i)=>s+i.qty*i.rate,0);
              const sc={draft:'#94a3b8',sent:'#3b82f6',paid:'#10b981',overdue:'#ef4444'}[inv.status];
              return <div key={inv.id} style={{background:'#0a1a0e',border:'1px solid #052e1c',borderRadius:'12px',padding:'14px',display:'flex',alignItems:'center',gap:'12px',transition:'all 0.2s',cursor:'pointer'}}
                onClick={()=>{setCurrent(inv);setView('edit');}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#10b98125'} onMouseLeave={e=>e.currentTarget.style.borderColor='#052e1c'}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                    <span style={{color:'white',fontSize:'13px',fontWeight:'500'}}>{inv.client||'Client'}</span>
                    <span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'4px',background:sc+'20',color:sc,fontWeight:'600'}}>{inv.status}</span>
                  </div>
                  <div style={{color:'#065f46',fontSize:'11px'}}>#{inv.number} · Due {inv.due}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                  <span style={{fontSize:'15px',fontWeight:'700',color:'#34d399'}}>${total.toFixed(2)}</span>
                  <button onClick={e=>{e.stopPropagation();exportInvoice(inv);}} style={{padding:'6px',borderRadius:'7px',background:'#10b98115',border:'none',cursor:'pointer',color:'#6ee7b7'}}><Download size={13}/></button>
                  <button onClick={e=>{e.stopPropagation();const u=invoices.filter(i=>i.id!==inv.id);setInvoices(u);persist(u);}} style={{padding:'6px',borderRadius:'7px',background:'none',border:'none',cursor:'pointer',color:'#065f46'}}><Trash2 size={13}/></button>
                </div>
              </div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceForm({invoice,onSave,onBack}:{invoice:Invoice|null;onSave:(i:Invoice)=>void;onBack:()=>void}) {
  const today=new Date().toISOString().split('T')[0];
  const due=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const [client,setClient]=useState(invoice?.client||'');
  const [clientEmail,setCE]=useState(invoice?.clientEmail||'');
  const [clientAddr,setCA]=useState(invoice?.clientAddress||'');
  const [date,setDate]=useState(invoice?.date||today);
  const [dueDate,setDue]=useState(invoice?.due||due);
  const [items,setItems]=useState<LineItem[]>(invoice?.items||[{id:crypto.randomUUID(),desc:'',qty:1,rate:0}]);
  const [notes,setNotes]=useState(invoice?.notes||'');
  const [status,setStatus]=useState<Invoice['status']>(invoice?.status||'draft');
  const total=items.reduce((s,i)=>s+i.qty*i.rate,0);
  const invNumber=invoice?.number||`INV-${Date.now().toString().slice(-5)}`;
  const inp={width:'100%',background:'#040d07',border:'1px solid #052e1c',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'13px',outline:'none',fontFamily:'Inter',transition:'border-color 0.2s'};
  const submit=()=>{
    if(!client.trim())return;
    onSave({id:invoice?.id||crypto.randomUUID(),number:invNumber,client,clientEmail,clientAddress:clientAddr,date,due:dueDate,items:items.filter(i=>i.desc.trim()),notes,status,createdAt:invoice?.createdAt||Date.now()});
  };
  return (
    <div style={{minHeight:'100vh',background:'#080f0a',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 20px',borderBottom:'1px solid #052e1c',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={onBack} style={{color:'#6ee7b7',background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontFamily:'Inter'}}>← Back</button>
        <span style={{color:'white',fontSize:'14px',fontWeight:'600'}}>#{invNumber}</span>
        <button onClick={submit} style={{padding:'8px 16px',borderRadius:'8px',background:'#10b981',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>Save</button>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'600px',margin:'0 auto'}}>
          {/* Status */}
          <div style={{display:'flex',gap:'6px'}}>
            {(['draft','sent','paid','overdue'] as const).map(s=>(
              <button key={s} onClick={()=>setStatus(s)} style={{flex:1,padding:'7px',borderRadius:'8px',border:`1px solid ${status===s?'#10b981':'#052e1c'}`,background:status===s?'#10b98115':'transparent',color:status===s?'#34d399':'#065f46',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize'}}>{s}</button>
            ))}
          </div>
          <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Client name *" style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          <input value={clientEmail} onChange={e=>setCE(e.target.value)} placeholder="Client email" style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          <input value={clientAddr} onChange={e=>setCA(e.target.value)} placeholder="Client address" style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
            <input type="date" value={dueDate} onChange={e=>setDue(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          </div>
          <div style={{background:'#0a1a0e',border:'1px solid #052e1c',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontSize:'12px',color:'#065f46',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px'}}>Line Items</div>
            {items.map((item,i)=>(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'1fr 60px 80px 32px',gap:'6px',marginBottom:'6px',alignItems:'center'}}>
                <input value={item.desc} onChange={e=>{const u=[...items];u[i]={...u[i],desc:e.target.value};setItems(u);}} placeholder="Description" style={{...inp,padding:'8px 10px'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <input type="number" value={item.qty} onChange={e=>{const u=[...items];u[i]={...u[i],qty:+e.target.value};setItems(u);}} style={{...inp,padding:'8px 10px',textAlign:'center'}} min="1" onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <input type="number" value={item.rate} onChange={e=>{const u=[...items];u[i]={...u[i],rate:+e.target.value};setItems(u);}} placeholder="Rate" style={{...inp,padding:'8px 10px'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{padding:'6px',background:'none',border:'none',cursor:'pointer',color:'#065f46'}}><X size={13}/></button>
              </div>
            ))}
            <button onClick={()=>setItems([...items,{id:crypto.randomUUID(),desc:'',qty:1,rate:0}])} style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',borderRadius:'7px',background:'transparent',border:'1px dashed #10b98130',color:'#34d399',fontSize:'12px',cursor:'pointer',fontFamily:'Inter',marginTop:'4px'}}>
              <Plus size={11}/> Add item
            </button>
            <div style={{textAlign:'right',marginTop:'12px',paddingTop:'10px',borderTop:'1px solid #052e1c'}}>
              <span style={{color:'#34d399',fontSize:'18px',fontWeight:'700'}}>Total: ${total.toFixed(2)}</span>
            </div>
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)" rows={3} style={{...inp,resize:'none',lineHeight:'1.6'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
        </div>
      </div>
    </div>
  );
}