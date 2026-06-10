import{f as I,b as w,j as e,C as o}from"./index-BIzhqy-P.js";import{u as U}from"./DashboardPage-cG2ZCQFY.js";import"./api-DctVftq-.js";import"./demoServiceOrders-DRf87oj0.js";import"./localization-CXT8xdl6.js";import"./runtimeCopy-DlHSW0Gq.js";function L(s,i,p,a){return new Promise((n,d)=>{if(!s){d(new Error("Database not initialized"));return}const t=new FileReader;t.onload=()=>{try{const c=s.transaction("documents","readwrite"),g=c.objectStore("documents"),h={id:`doc-${Date.now()}`,orderId:p,filename:i.name,filesize:i.size,filetype:i.type,filedata:t.result,uploadedAt:new Date().toISOString(),uploadedBy:a,status:"uploaded",risk:"Bajo",reviewer:null,notes:"",version:1},m=g.add(h);m.onsuccess=()=>n(h),m.onerror=()=>d(m.error),c.onerror=()=>d(c.error)}catch(c){d(c)}},t.onerror=()=>d(t.error),t.readAsArrayBuffer(i)})}function H(s,i){return new Promise((p,a)=>{if(!s){a(new Error("Database not initialized"));return}try{const n=s.transaction("documents","readonly"),c=n.objectStore("documents").index("orderId").getAll(i);c.onsuccess=()=>p(c.result),c.onerror=()=>a(c.error),n.onerror=()=>a(n.error)}catch(n){a(n)}})}function V(s,i,p){return new Promise((a,n)=>{if(!s){n(new Error("Database not initialized"));return}try{const d=s.transaction("documents","readwrite"),t=d.objectStore("documents"),c=t.get(i);c.onsuccess=()=>{const g=c.result;if(!g){n(new Error("Document not found"));return}const h={...g,...p,version:(g.version||1)+1},m=t.put(h);m.onsuccess=()=>a(h),m.onerror=()=>n(m.error)},c.onerror=()=>n(c.error),d.onerror=()=>n(d.error)}catch(d){n(d)}})}function q(s,i){return new Promise((p,a)=>{if(!s){a(new Error("Database not initialized"));return}try{const n=s.transaction("documents","readwrite"),t=n.objectStore("documents").delete(i);t.onsuccess=()=>p(!0),t.onerror=()=>a(t.error),n.onerror=()=>a(n.error)}catch(n){a(n)}})}function D(s,i,p,a,n,d){return new Promise((t,c)=>{if(!s){c(new Error("Database not initialized"));return}try{const g=s.transaction("logs","readwrite"),h=g.objectStore("logs"),m={timestamp:new Date().toISOString(),action:i,entityType:p,entityId:a,userId:n,changes:d,userAgent:navigator.userAgent},x=h.add(m);x.onsuccess=()=>t(m),x.onerror=()=>c(x.error),g.onerror=()=>c(g.error)}catch(g){c(g)}})}function R(s,i){return new Promise((p,a)=>{if(!s){a(new Error("Database not initialized"));return}try{const n=s.transaction("logs","readonly"),t=n.objectStore("logs").getAll();t.onsuccess=()=>{const h=t.result.filter(m=>m.entityId===i).sort((m,x)=>new Date(x.timestamp)-new Date(m.timestamp));p(h)},t.onerror=()=>a(t.error),n.onerror=()=>a(n.error)}catch(n){a(n)}})}function G(s,i=null){try{const p=localStorage.getItem(s);return p?JSON.parse(p):i}catch(p){return console.error("Error getting config:",p),i}}function J(){return G("currentOrderId","order-demo-001")}function X(s,i={}){let p=0;const a=[],n=s.filter(y=>y.status==="approved").length,d=s.length,t=d>0?n/d*60:0;p+=t,a.push({category:"Documentos",weight:60,earned:Math.round(t),detail:`${n}/${d} aprobados`,status:n===d?"complete":n>0?"partial":"missing"});const c=s.filter(y=>y.risk==="Critico"||y.risk==="Alto").length,g=c===0?25:c>2?0:25-c*12;p+=Math.max(0,g),a.push({category:"Riesgos Documentales",weight:25,earned:Math.max(0,Math.round(g)),detail:c===0?"Sin riesgos críticos":`${c} documento(s) con riesgo alto`,status:c===0?"complete":"partial"});const h=i.hasInconsistencies||!1,m=h?0:15;p+=m,a.push({category:"Consistencia",weight:15,earned:Math.round(m),detail:h?"Detectadas inconsistencias entre documentos":"Documentos consistentes",status:h?"partial":"complete"});const x=Math.round(p);let j="ROJO",E="#C62828",u=!1,k=[];if(x>=70?(j="VERDE",E="#2E7D32",u=!0,k=["Listo para presentar a instituciones financieras"]):x>=50?(j="AMARILLO",E="#F59E0B",u=!1,k=[]):(j="ROJO",E="#C62828",u=!1),n<d){const y=s.filter(b=>b.status!=="approved");k.unshift(`Completar: ${y.map(b=>b.filename||b.name).join(", ")}`)}if(c>0){const y=s.filter(b=>b.risk==="Critico"||b.risk==="Alto");k.unshift(`Revisar riesgos: ${y.map(b=>b.filename||b.name).join(", ")}`)}return k.length===0&&x>=50&&(k=["Revisar observaciones documentales","Validar consistencia entre documentos"]),{totalScore:x,status:j,statusColor:E,canPublish:u,breakdown:a,nextActions:k,summary:{docsApproved:n,docsTotal:d,criticalRisks:c,hasInconsistencies:h}}}function F(s,i,p,a){const n=new Date().toLocaleString("es-MX"),d=`REPORT-${Date.now()}`;return{id:d,title:`Reporte de Expediente: ${(s==null?void 0:s.name)||"Sin nombre"}`,timestamp:n,format:"html",html:_(s,i,p,a,n,d)}}function _(s,i,p,a,n,d){return`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Expediente</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #0F1F2E;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #0F1F2E;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .meta {
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #0F1F2E;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: 700;
      margin-bottom: 15px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .score-card {
      background: linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .score-value {
      font-size: 48px;
      font-weight: 800;
      margin: 10px 0;
    }
    .score-status {
      display: inline-block;
      padding: 8px 16px;
      background: white;
      border-radius: 4px;
      font-weight: 700;
      margin-top: 10px;
    }
    .score-status.verde {
      color: #2E7D32;
    }
    .score-status.amarillo {
      color: #F59E0B;
    }
    .score-status.rojo {
      color: #C62828;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9f9f9;
      padding: 12px;
      border-left: 3px solid #C9A84C;
      border-radius: 4px;
    }
    .info-label {
      color: #666;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      color: #0F1F2E;
      font-weight: 700;
      font-size: 14px;
    }
    .breakdown {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .breakdown-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .breakdown-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .breakdown-category {
      font-weight: 700;
      color: #0F1F2E;
    }
    .breakdown-score {
      text-align: right;
      color: #C9A84C;
      font-weight: 700;
    }
    .progress-bar {
      background: #e0e0e0;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill {
      height: 100%;
      background: #C9A84C;
      border-radius: 4px;
    }
    .document-list {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
    }
    .document-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .document-item:last-child {
      border-bottom: none;
    }
    .document-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      margin-left: 10px;
    }
    .status-approved {
      background: rgba(46, 125, 50, 0.2);
      color: #2E7D32;
    }
    .status-pending {
      background: rgba(255, 152, 0, 0.2);
      color: #F59E0B;
    }
    .next-steps {
      background: #E8F5E9;
      border-left: 4px solid #2E7D32;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .next-steps h3 {
      margin: 0 0 10px 0;
      color: #2E7D32;
      font-size: 14px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
      color: #333;
    }
    .next-steps li {
      margin-bottom: 5px;
    }
    .footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        margin: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reporte de Expediente</h1>
      <div class="meta">
        <p>Generado: ${n}</p>
        <p>ID: ${d}</p>
      </div>
    </div>

    <!-- INFORMACIÓN GENERAL -->
    <div class="section">
      <div class="section-title">📋 Información General</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${(s==null?void 0:s.name)||"N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Solicitante</div>
          <div class="info-value">${(s==null?void 0:s.applicant)||"N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Sector</div>
          <div class="info-value">${(s==null?void 0:s.sector)||"N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Monto Solicitado</div>
          <div class="info-value">${(s==null?void 0:s.amountLabel)||"N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Riesgo</div>
          <div class="info-value">${(s==null?void 0:s.risk)||"N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estado</div>
          <div class="info-value">${(s==null?void 0:s.status)||"N/A"}</div>
        </div>
      </div>
    </div>

    <!-- PUNTUACIÓN -->
    <div class="section">
      <div class="section-title">🎯 Evaluación y Puntuación</div>
      ${i?`
      <div class="score-card">
        <div>Puntuación Total</div>
        <div class="score-value">${i.totalScore}/100</div>
        <span class="score-status ${i.status.toLowerCase()}">${i.status}</span>
      </div>
      <div class="breakdown">
        ${i.breakdown.map(t=>`
        <div class="breakdown-item">
          <div class="breakdown-category">${t.category}</div>
          <div class="breakdown-score">${t.earned}/${t.weight}</div>
        </div>
        <div style="grid-column: 1/-1;">
          <small style="color: #666;">${t.detail}</small>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${t.earned/t.weight*100}%"></div>
          </div>
        </div>
        `).join("")}
      </div>
      ${i.nextActions.length>0?`
      <div class="next-steps">
        <h3>📌 Próximos Pasos</h3>
        <ul>
          ${i.nextActions.map(t=>`<li>${t}</li>`).join("")}
        </ul>
      </div>
      `:""}
      `:"<p>Sin evaluación disponible</p>"}
    </div>

    <!-- DOCUMENTOS -->
    <div class="section">
      <div class="section-title">📄 Documentos Cargados</div>
      ${p&&p.length>0?`
      <div class="document-list">
        ${p.map(t=>`
        <div class="document-item">
          <strong>${t.filename||t.name}</strong>
          <span class="document-status ${t.status==="approved"?"status-approved":"status-pending"}">
            ${t.status==="approved"?"Aprobado":"Pendiente"}
          </span>
          <br/>
          <small style="color: #666;">Riesgo: ${t.risk||"N/A"} | Revisor: ${t.reviewer||"N/A"}</small>
        </div>
        `).join("")}
      </div>
      `:"<p>Sin documentos cargados</p>"}
    </div>

    <!-- REQUERIMIENTOS -->
    <div class="section">
      <div class="section-title">📬 Requerimientos y Solicitudes</div>
      ${a&&a.length>0?`
      <div class="document-list">
        ${a.map(t=>`
        <div class="document-item">
          <strong>${t.title}</strong>
          <span class="document-status ${t.status==="approved"?"status-approved":"status-pending"}">
            ${t.status==="approved"?"Aprobado":"Pendiente"}
          </span>
          <br/>
          <small style="color: #666;">Prioridad: ${t.priority||"normal"} | Creado: ${new Date(t.createdAt).toLocaleDateString("es-MX")}</small>
          ${t.dueDate?`<br/><small style="color: #666;">Vencimiento: ${new Date(t.dueDate).toLocaleDateString("es-MX")}</small>`:""}
        </div>
        `).join("")}
      </div>
      `:"<p>Sin requerimientos pendientes</p>"}
    </div>

    <div class="footer">
      <p>Este reporte fue generado automáticamente por el sistema NSD.</p>
      <p>Para más información, contacte al administrador de cumplimiento.</p>
    </div>
  </div>
</body>
</html>
  `}function Y(s){const i=document.createElement("a"),p=new Blob([s.html],{type:"text/html"});i.href=URL.createObjectURL(p),i.download=`${s.id}.html`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(i.href)}function Q(s){const i=window.open("","","height=600,width=800");i.document.write(s.html),i.document.close(),i.print()}const M=[{id:1,name:"Constancia de situacion fiscal",owner:"Empresa",status:"approved",expires:"2026-09-12",risk:"Bajo",reviewer:"Ana Compliance",version:"v3",notes:"Documento vigente y consistente con RFC capturado."},{id:2,name:"Identificacion representante legal",owner:"Representante",status:"review",expires:"2026-07-30",risk:"Medio",reviewer:"Luis Riesgos",version:"v1",notes:"Pendiente validar coincidencia con poderes."},{id:3,name:"Comprobante de domicilio",owner:"Empresa",status:"observed",expires:"2026-06-15",risk:"Alto",reviewer:"Mariana Legal",version:"v2",notes:"La fecha de emision supera la vigencia aceptada por politica interna."},{id:4,name:"Acta constitutiva",owner:"Empresa",status:"approved",expires:"2027-01-20",risk:"Bajo",reviewer:"Ana Compliance",version:"v4",notes:"Version completa con objeto social y sello de registro."},{id:5,name:"Estructura accionaria y UBO",owner:"Beneficiarios finales",status:"missing",expires:"Sin cargar",risk:"Critico",reviewer:"Sin asignar",version:"N/A",notes:"Requisito indispensable para cierre de expediente."},{id:6,name:"Estados financieros",owner:"Empresa",status:"review",expires:"2026-08-01",risk:"Medio",reviewer:"Luis Riesgos",version:"v1",notes:"Pendiente revisar consistencia contra declaraciones."}],C={uploaded:{label:"Cargado",color:o.amber,bg:"#FEF3C7"},review:{label:"En revision",color:o.amber,bg:"#FEF3C7"},approved:{label:"Aprobado",color:o.green,bg:"#E8F5E9"},observed:{label:"Observado",color:"#C62828",bg:"#FFEBEE"},missing:{label:"No cargado",color:o.textMuted,bg:"#F2EFE9"}};function se(){const{addNotification:s}=I(),{db:i,error:p}=U("nsd-app",1),a=J(),[n,d]=w.useState([]),[t,c]=w.useState(null),[g,h]=w.useState(!0),[m,x]=w.useState([]),[j,E]=w.useState(!1),[u,k]=w.useState(null),[y,b]=w.useState(!1);w.useEffect(()=>{if(!i)return;(async()=>{try{const l=await H(i,a);if(l.length===0){const f=M.map(v=>({...v,orderId:a,filesize:v.filesize||25e4,filetype:v.filetype||"application/pdf"}));for(const v of f)try{const S=new Blob(["fake content"],{type:v.filetype});await L(i,S,a,"demo-user")}catch{}d(f)}else d(l);h(!1)}catch(l){console.error("Error loading docs:",l),d(M),h(!1)}})()},[i,a]),w.useEffect(()=>{if(!i)return;(async()=>{try{const l=await R(i,a);x(l)}catch(l){console.error("Error loading logs:",l)}})()},[i,a]),w.useEffect(()=>{if(n.length>0){const r=X(n);k(r)}},[n]);const P=async r=>{const l=r.target.files[0];if(!l)return;if(!["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel"].includes(l.type)){s("Solo PDF, Word, Excel permitidos","error");return}if(l.size>50*1024*1024){s("Archivo muy grande (máx 50MB)","error");return}try{const v=await L(i,l,a,"current-user-id");await D(i,"document_uploaded","document",v.id,"current-user-id",{filename:l.name,size:l.size}),d([...n,v]),x(await R(i,a)),s(`"${l.name}" subido exitosamente`,"success")}catch(v){console.error("Upload error:",v),s("Error al subir archivo","error")}},$=async(r,l)=>{try{const f=n.find(S=>S.id===r),v=await V(i,r,{status:l});await D(i,"status_changed","document",r,"current-user-id",{from:f.status,to:l}),d(n.map(S=>S.id===r?v:S)),c(v),x(await R(i,a)),s(`Estado actualizado: ${C[l].label}`,"success")}catch(f){console.error("Update error:",f),s("Error al actualizar","error")}},O=async r=>{if(window.confirm("¿Eliminar documento?"))try{await q(i,r),await D(i,"document_deleted","document",r,"current-user-id",{}),d(n.filter(l=>l.id!==r)),c(null),x(await R(i,a)),s("Documento eliminado","success")}catch(l){console.error("Delete error:",l),s("Error al eliminar","error")}},A=async r=>{t&&await $(t.id,r)},W=()=>{const r=F({name:a,status:"Cumplimiento"},u,n,[]);Y(r),s("Reporte descargado exitosamente","success"),b(!1)},N=()=>{const r=F({name:a,status:"Cumplimiento"},u,n,[]);Q(r),b(!1)},z=n.filter(r=>r.status==="approved").length,B=n.length>0?Math.round(z/n.length*100):0,T=n.filter(r=>r.risk==="Alto"||r.risk==="Critico").length;return e.jsxs("div",{children:[g&&e.jsx("p",{children:"Cargando documentos..."}),p&&e.jsxs("p",{style:{color:"red"},children:["Error: ",p.message]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1.5rem",marginBottom:"2rem"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{color:o.navy,fontSize:"2rem",marginBottom:"0.5rem"},children:"Expediente de cumplimiento"}),e.jsxs("p",{style:{color:o.textMuted,maxWidth:"760px"},children:["Documentos guardados localmente en tiempo real. Orden: ",a]})]}),e.jsxs("div",{style:{display:"flex",gap:"0.75rem"},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx("button",{onClick:()=>b(!y),style:{padding:"0.75rem 1.25rem",background:o.green,color:"white",border:"none",borderRadius:"6px",fontWeight:700,cursor:"pointer"},children:"📊 Reporte"}),y&&e.jsxs("div",{style:{position:"absolute",top:"100%",right:0,marginTop:"0.5rem",background:o.white,border:`1px solid ${o.border}`,borderRadius:"6px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",zIndex:10,overflow:"hidden",minWidth:"180px"},children:[e.jsx("button",{onClick:W,style:{width:"100%",padding:"0.75rem 1rem",background:"transparent",border:"none",textAlign:"left",color:o.navy,cursor:"pointer",fontSize:"0.9rem",fontWeight:700,borderBottom:`1px solid ${o.border}`},children:"⬇️ Descargar HTML"}),e.jsx("button",{onClick:N,style:{width:"100%",padding:"0.75rem 1rem",background:"transparent",border:"none",textAlign:"left",color:o.navy,cursor:"pointer",fontSize:"0.9rem",fontWeight:700},children:"🖨️ Imprimir"})]})]}),e.jsxs("button",{onClick:()=>E(!j),style:{padding:"0.75rem 1.25rem",background:o.gold,color:o.navy,border:"none",borderRadius:"6px",fontWeight:700,cursor:"pointer"},children:[j?"Ocultar":"Ver"," Historial (",m.length,")"]})]})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:"1rem",marginBottom:"2rem"},children:[{label:"Puntuación total",value:u?`${u.totalScore}/100`:"—",color:u?u.statusColor:o.textMuted,highlight:!0},{label:"Estado",value:u?u.status:"—",color:u?u.statusColor:o.textMuted},{label:"Documentos aprobados",value:`${z}/${n.length}`,color:o.navy},{label:"Riesgos altos",value:T,color:"#C62828"}].map(r=>e.jsxs("div",{style:{background:o.white,padding:"1.25rem",borderRadius:"10px",borderTop:`4px solid ${r.color}`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",...r.highlight&&{borderWidth:"3px"}},children:[e.jsx("p",{style:{color:o.textMuted,fontSize:"0.82rem",textTransform:"uppercase",letterSpacing:"0.05em"},children:r.label}),e.jsx("p",{style:{color:r.color,fontSize:"1.9rem",fontWeight:800,marginTop:"0.4rem"},children:r.value})]},r.label))}),e.jsxs("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",marginBottom:"2rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"0.75rem"},children:[e.jsx("p",{style:{color:o.navy,fontWeight:700},children:"Progreso del expediente"}),e.jsxs("p",{style:{color:o.gold,fontWeight:800},children:[B,"%"]})]}),e.jsx("div",{className:"progress-bar",children:e.jsx("div",{className:"progress-fill",style:{width:`${B}%`}})})]}),u&&e.jsxs("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",marginBottom:"2rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",borderLeft:`5px solid ${u.statusColor}`},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"},children:[e.jsx("h3",{style:{color:o.navy,margin:0},children:"Análisis de puntuación"}),e.jsx("div",{style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:u.statusColor,color:"white",borderRadius:"6px",fontWeight:800,fontSize:"1.1rem"},children:u.status})]}),e.jsx("div",{style:{display:"grid",gap:"1rem"},children:u.breakdown.map(r=>e.jsxs("div",{style:{background:o.bg,padding:"1rem",borderRadius:"8px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"},children:[e.jsx("span",{style:{color:o.navy,fontWeight:700},children:r.category}),e.jsxs("span",{style:{color:o.gold,fontWeight:800},children:[r.earned,"/",r.weight]})]}),e.jsx("p",{style:{color:o.textMuted,fontSize:"0.9rem",margin:"0.25rem 0"},children:r.detail}),e.jsx("div",{style:{background:o.white,height:"6px",borderRadius:"3px",overflow:"hidden",marginTop:"0.5rem"},children:e.jsx("div",{style:{background:r.status==="complete"?o.green:r.status==="partial"?o.amber:"#C62828",height:"100%",width:`${r.earned/r.weight*100}%`,transition:"width 0.3s ease"}})})]},r.category))}),u.nextActions.length>0&&e.jsxs("div",{style:{background:"#FFF3CD",padding:"1rem",borderRadius:"8px",marginTop:"1.5rem",borderLeft:`4px solid ${o.amber}`},children:[e.jsx("p",{style:{color:o.navy,fontWeight:700,marginTop:0,marginBottom:"0.75rem"},children:"📋 Próximos pasos:"}),e.jsx("ul",{style:{color:o.text,margin:0,paddingLeft:"1.5rem",lineHeight:1.8},children:u.nextActions.map((r,l)=>e.jsx("li",{children:r},l))})]}),u.canPublish&&e.jsx("div",{style:{background:"#D4EDDA",padding:"1rem",borderRadius:"8px",marginTop:"1.5rem",borderLeft:`4px solid ${o.green}`,color:"#155724",fontWeight:700},children:"✅ Expediente listo para presentar a instituciones financieras"})]}),e.jsx("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",marginBottom:"2rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},children:e.jsxs("label",{style:{display:"block",padding:"2rem",border:"2px dashed #CCC",borderRadius:"8px",textAlign:"center",cursor:"pointer",backgroundColor:"#F9F9F9",transition:"all 0.3s ease"},children:[e.jsx("span",{style:{color:o.navy,fontWeight:700,fontSize:"1.1rem"},children:"📄 Arrastra documento aquí o click para seleccionar"}),e.jsx("input",{type:"file",onChange:P,style:{display:"none"},accept:".pdf,.docx,.xlsx,.doc,.xls"})]})}),e.jsxs("div",{className:"dashboard-detail-grid",style:{display:"grid",gridTemplateColumns:"minmax(0, 1.45fr) minmax(320px, 0.9fr)",gap:"1.5rem",alignItems:"start"},children:[e.jsxs("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},children:[e.jsx("h2",{style:{color:o.navy,marginBottom:"1.5rem"},children:"Requisitos documentales"}),e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Documento"}),e.jsx("th",{children:"Responsable"}),e.jsx("th",{children:"Estado"}),e.jsx("th",{children:"Vencimiento"}),e.jsx("th",{children:"Riesgo"}),e.jsx("th",{children:"Accion"})]})}),e.jsx("tbody",{children:n.map(r=>{const l=C[r.status];return e.jsxs("tr",{onClick:()=>c(r),style:{cursor:"pointer",outline:(t==null?void 0:t.id)===r.id?`2px solid ${o.gold}`:"none",outlineOffset:"-2px"},children:[e.jsx("td",{style:{fontWeight:700,color:o.navy},children:r.filename||r.name}),e.jsx("td",{children:r.owner}),e.jsx("td",{children:e.jsx("span",{style:{display:"inline-flex",padding:"0.35rem 0.7rem",borderRadius:"999px",background:l.bg,color:l.color,fontSize:"0.8rem",fontWeight:700},children:l.label})}),e.jsx("td",{children:r.expires}),e.jsx("td",{style:{color:r.risk==="Critico"||r.risk==="Alto"?"#C62828":o.text,fontWeight:700},children:r.risk}),e.jsxs("td",{style:{display:"flex",gap:"0.5rem"},children:[e.jsxs("select",{onChange:f=>$(r.id,f.target.value),value:r.status,onClick:f=>f.stopPropagation(),style:{padding:"0.5rem",borderRadius:"4px",border:`1px solid ${o.border}`,color:o.navy,fontWeight:700,cursor:"pointer"},children:[e.jsx("option",{value:"uploaded",children:"Cargado"}),e.jsx("option",{value:"review",children:"Revisión"}),e.jsx("option",{value:"approved",children:"Aprobado"}),e.jsx("option",{value:"observed",children:"Observado"})]}),e.jsx("button",{onClick:f=>{f.stopPropagation(),O(r.id)},style:{padding:"0.5rem 0.75rem",background:"#C62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:700},children:"🗑️"})]})]},r.id)})})]})})]}),t&&e.jsxs("aside",{style:{background:o.white,borderRadius:"10px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",border:`1px solid ${o.border}`,overflow:"hidden",position:"sticky",top:"96px"},children:[e.jsxs("div",{style:{padding:"1.5rem",background:o.bg,borderBottom:`1px solid ${o.border}`},children:[e.jsx("p",{style:{color:o.textMuted,fontSize:"0.78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"0.4rem"},children:"Detalle del documento"}),e.jsx("h3",{style:{color:o.navy,fontSize:"1.2rem",lineHeight:1.35},children:t.filename||t.name})]}),e.jsxs("div",{style:{padding:"1.5rem",display:"grid",gap:"1rem"},children:[[["Responsable",t.owner],["Revisor",t.reviewer],["Version",t.version],["Vencimiento",t.expires],["Riesgo",t.risk]].map(([r,l])=>e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:"1rem"},children:[e.jsx("span",{style:{color:o.textMuted,fontSize:"0.86rem"},children:r}),e.jsx("strong",{style:{color:o.navy,textAlign:"right"},children:l})]},r)),e.jsxs("div",{children:[e.jsx("p",{style:{color:o.textMuted,fontSize:"0.86rem",marginBottom:"0.45rem"},children:"Estado actual"}),e.jsx("span",{style:{display:"inline-flex",padding:"0.35rem 0.7rem",borderRadius:"999px",background:C[t.status].bg,color:C[t.status].color,fontSize:"0.8rem",fontWeight:800},children:C[t.status].label})]}),e.jsxs("div",{style:{background:o.bg,padding:"1rem",borderRadius:"8px"},children:[e.jsx("p",{style:{color:o.navy,fontWeight:800,marginBottom:"0.4rem"},children:"Observaciones"}),e.jsx("p",{style:{color:o.textMuted,fontSize:"0.9rem",lineHeight:1.6},children:t.notes})]}),e.jsxs("div",{style:{background:o.bg,padding:"1rem",borderRadius:"8px"},children:[e.jsx("p",{style:{color:o.navy,fontWeight:800,marginBottom:"0.65rem"},children:"Historial"}),["Documento cargado por cliente","Revision asignada",t.status==="approved"?"Aprobado con evidencia":"Pendiente de cierre"].map(r=>e.jsxs("p",{style:{color:o.textMuted,fontSize:"0.86rem",marginBottom:"0.4rem"},children:["- ",r]},r))]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"},children:[e.jsx("button",{onClick:()=>A("approved"),style:{padding:"0.7rem",background:o.green,color:o.white,border:"none",borderRadius:"6px",fontWeight:800},children:"Aprobar"}),e.jsx("button",{onClick:()=>A("observed"),style:{padding:"0.7rem",background:o.amber,color:o.white,border:"none",borderRadius:"6px",fontWeight:800},children:"Observar"})]})]})]})]}),j&&m.length>0&&e.jsxs("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",marginTop:"2rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},children:[e.jsx("h2",{style:{color:o.navy,marginBottom:"1.5rem"},children:"Historial de auditoría"}),e.jsx("div",{style:{maxHeight:"400px",overflowY:"auto"},children:m.map((r,l)=>e.jsxs("div",{style:{borderLeft:`3px solid ${o.gold}`,paddingLeft:"1rem",marginBottom:"1rem",paddingBottom:"1rem",borderBottom:l<m.length-1?`1px solid ${o.border}`:"none"},children:[e.jsx("p",{style:{color:o.navy,fontWeight:700,margin:0,fontSize:"0.9rem"},children:new Date(r.timestamp).toLocaleString()}),e.jsxs("p",{style:{color:o.textMuted,margin:"0.25rem 0",fontSize:"0.85rem"},children:[r.action," - ",r.userId]}),e.jsx("p",{style:{color:o.text,margin:0,fontSize:"0.85rem"},children:JSON.stringify(r.changes)})]},l))})]}),j&&m.length===0&&e.jsx("div",{style:{background:o.white,padding:"2rem",borderRadius:"10px",marginTop:"2rem",textAlign:"center",color:o.textMuted},children:e.jsx("p",{children:"No hay eventos registrados aún"})})]})}export{se as default};
