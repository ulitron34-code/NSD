import{f as F,u as R,b as g,j as t,C as i}from"./index-BIzhqy-P.js";import{u as T}from"./DashboardPage-cG2ZCQFY.js";import{e as k,d as A,g as L,u as B}from"./expedienteService-L3IQNd73.js";import{g as N}from"./documentService-B9UaHw8Y.js";import{b as I}from"./requirementServiceV2-2SWxdWxu.js";import{g as O}from"./messagingServiceV2-DJMVNj_5.js";import"./api-DctVftq-.js";import"./demoServiceOrders-DRf87oj0.js";import"./localization-CXT8xdl6.js";import"./runtimeCopy-DlHSW0Gq.js";async function W(r,c,n,s){try{const m=`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${r.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 40px;
              max-width: 900px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #0F1F2E;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #0F1F2E;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #1B3A5C;
              border-left: 4px solid #C9A84C;
              padding-left: 12px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              background: #f5f5f5;
              padding: 12px;
              border-radius: 6px;
            }
            .info-label {
              font-weight: bold;
              color: #0F1F2E;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              color: #333;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-activo {
              background: #E8F5E9;
              color: #2E7D32;
            }
            .status-pausado {
              background: #FFF3CD;
              color: #F57F17;
            }
            .status-cerrado {
              background: #FFEBEE;
              color: #C62828;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f5f5f5;
              color: #0F1F2E;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #ddd;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              border-top: 3px solid #C9A84C;
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #0F1F2E;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
            .activity-item {
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            .activity-item:last-child {
              border-bottom: none;
            }
            .activity-icon {
              font-size: 16px;
              margin-right: 10px;
            }
            .activity-time {
              font-size: 12px;
              color: #999;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${r.title}</h1>
            <p>ID: ${r.id}</p>
            <p>Generado: ${new Date().toLocaleDateString("es-MX")}</p>
          </div>

          <!-- INFORMACIÓN GENERAL -->
          <div class="section">
            <h2>Información del Expediente</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Solicitante</div>
                <div class="info-value">${r.solicitanteName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Otorgante</div>
                <div class="info-value">${r.otorganteName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Monto</div>
                <div class="info-value">$${(r.amount||0).toLocaleString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Sector</div>
                <div class="info-value">${r.sector}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">
                  <span class="status-badge status-${r.status}">
                    ${r.status}
                  </span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Creado</div>
                <div class="info-value">${new Date(r.createdAt).toLocaleDateString("es-MX")}</div>
              </div>
            </div>
          </div>

          <!-- ESTADÍSTICAS -->
          <div class="section">
            <h2>Resumen de Actividad</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${n.length}</div>
                <div class="stat-label">Documentos</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${c.length}</div>
                <div class="stat-label">Requerimientos</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${s.length}</div>
                <div class="stat-label">Mensajes</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${Math.ceil((new Date-new Date(r.createdAt))/864e5)}</div>
                <div class="stat-label">Días en proceso</div>
              </div>
            </div>
          </div>

          <!-- DOCUMENTOS -->
          <div class="section">
            <h2>Documentos (${n.length})</h2>
            ${n.length>0?`
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  ${n.map(a=>`
                    <tr>
                      <td>${a.fileName}</td>
                      <td>${a.documentType||"-"}</td>
                      <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                      <td>${new Date(a.uploadedAt).toLocaleDateString("es-MX")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `:"<p>Sin documentos</p>"}
          </div>

          <!-- REQUERIMIENTOS -->
          <div class="section">
            <h2>Requerimientos (${c.length})</h2>
            ${c.length>0?`
              <table>
                <thead>
                  <tr>
                    <th>Requerimiento</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.map(a=>`
                    <tr>
                      <td>${a.title}</td>
                      <td>${a.priority}</td>
                      <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                      <td>${a.dueDate?new Date(a.dueDate).toLocaleDateString("es-MX"):"-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `:"<p>Sin requerimientos</p>"}
          </div>

          <!-- ACTIVIDAD RECIENTE -->
          <div class="section">
            <h2>Actividad Reciente</h2>
            ${s.length>0?s.slice(0,5).map(a=>`
              <div class="activity-item">
                <strong>${a.fromUserName}:</strong> ${a.body}
                <div class="activity-time">${new Date(a.createdAt).toLocaleDateString("es-MX")} ${new Date(a.createdAt).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            `).join(""):"<p>Sin actividad reciente</p>"}
          </div>

          <div class="footer">
            <p>Documento generado automáticamente por NSD Compliance Platform</p>
            <p>${new Date().toLocaleString("es-MX")}</p>
          </div>
        </body>
      </html>
    `;return P(m,`${r.id}_${r.title}.html`),{success:!0,fileName:`${r.id}_${r.title}.html`}}catch(m){throw new Error(`Error generando PDF: ${m.message}`)}}function P(r,c){const n=new Blob([r],{type:"text/html;charset=utf-8"}),s=document.createElement("a");s.href=URL.createObjectURL(n),s.download=c,document.body.appendChild(s),s.click(),document.body.removeChild(s)}async function U(r,c){if(!c||c.trim()==="")return r;const n=c.toLowerCase();return r.filter(s=>{const m=[s.title||"",s.id||"",s.solicitanteName||"",s.otorganteName||"",s.sector||"",s.status||"",s.description||"",(s.amount||"").toString()];let a=0;return m.some(p=>p.toLowerCase()===n)&&(a+=100),m.some(p=>p.toLowerCase().startsWith(n))&&(a+=50),m.some(p=>p.toLowerCase().includes(n))&&(a+=10),a>0})}function et(){var E,$,D;const{addNotification:r}=F(),{db:c}=T("nsd-app",1),{user:n}=R(),[s,m]=g.useState([]),[a,p]=g.useState([]),[w,b]=g.useState(!0),[o,y]=g.useState(null),[X,q]=g.useState(!1),[x,C]=g.useState(""),[u,S]=g.useState(null);g.useEffect(()=>{if(!n)return;(async()=>{try{let d=await k(n.id);d.length===0&&(d=[await A()],r("Expediente demo creado","info")),m(d),b(!1)}catch(d){console.error("Error loading expedientes:",d),b(!1)}})()},[n,c]),g.useEffect(()=>{if(x.trim()==="")p(s);else{const e=U(s,x);p(e)}},[s,x]);const z=async e=>{try{S(e);const d=await L(e),l=await N(e),h=await I(e),f=await O(n.id,e)||[];await W(d,h,l,f),r(`📥 Expediente ${d.id} descargado`,"success")}catch(d){console.error("Error exportando PDF:",d),r("Error al exportar PDF","error")}finally{S(null)}},M=async(e,d)=>{try{const l=await B(e,{status:d});m(s.map(h=>h.id===e?l:h)),y(l),r(`Expediente actualizado a: ${d}`,"success")}catch(l){console.error("Error updating expediente:",l),r("Error al actualizar expediente","error")}},v=e=>e.solicitanteId===(n==null?void 0:n.id)?"Solicitante":e.otorganteId===(n==null?void 0:n.id)?"Otorgante":"Desconocido",j=e=>{switch(e){case"activo":return i.green;case"pausado":return i.amber;case"cerrado":return"#C62828";default:return i.navy}};return w?t.jsx("p",{children:"Cargando expedientes..."}):t.jsxs("div",{children:[t.jsx("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1.5rem",marginBottom:"2rem"},children:t.jsxs("div",{children:[t.jsx("h1",{style:{color:i.navy,fontSize:"2rem",marginBottom:"0.5rem"},children:"📋 Mis Expedientes"}),t.jsxs("p",{style:{color:i.textMuted,maxWidth:"760px"},children:["Órdenes vinculadas entre Solicitante y Otorgante. Tienes acceso a ",s.length," expediente(s)."]})]})}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsx("input",{type:"text",placeholder:"🔍 Busca por nombre, ID, sector...",value:x,onChange:e=>C(e.target.value),style:{width:"100%",maxWidth:"500px",padding:"0.75rem 1rem",border:`2px solid ${i.border}`,borderRadius:"8px",fontSize:"0.95rem",fontWeight:500}}),x&&t.jsxs("p",{style:{color:i.textMuted,fontSize:"0.85rem",margin:"0.5rem 0 0 0"},children:["📊 ",a.length," resultado(s)"]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"1.5rem",marginBottom:"2rem"},children:[a.length===0&&t.jsx("p",{style:{color:i.textMuted,gridColumn:"1 / -1",textAlign:"center",padding:"2rem"},children:"No hay expedientes que coincidan con la búsqueda"}),a.map(e=>{var d,l,h;return t.jsxs("div",{onClick:()=>y(e),style:{background:i.white,border:(o==null?void 0:o.id)===e.id?`2px solid ${i.gold}`:`1px solid ${i.border}`,borderRadius:"10px",padding:"1.5rem",cursor:"pointer",transition:"all 0.2s",boxShadow:(o==null?void 0:o.id)===e.id?"0 4px 16px rgba(201, 168, 76, 0.3)":"0 2px 8px rgba(0,0,0,0.08)"},onMouseEnter:f=>{(o==null?void 0:o.id)!==e.id&&(f.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.12)")},onMouseLeave:f=>{(o==null?void 0:o.id)!==e.id&&(f.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)")},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"1rem"},children:[t.jsxs("div",{children:[t.jsx("h3",{style:{color:i.navy,margin:0,marginBottom:"0.5rem",fontSize:"1.1rem"},children:e.title}),t.jsx("p",{style:{color:i.textMuted,fontSize:"0.85rem",margin:0},children:e.id})]}),t.jsx("span",{style:{display:"inline-block",padding:"0.35rem 0.7rem",borderRadius:"999px",background:`${j(e.status)}33`,color:j(e.status),fontSize:"0.8rem",fontWeight:700,textTransform:"capitalize"},children:e.status})]}),t.jsxs("div",{style:{display:"grid",gap:"0.5rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{fontSize:"0.9rem"},children:[t.jsx("strong",{style:{color:i.navy},children:"Mi rol:"})," ",v(e)]}),t.jsxs("div",{style:{fontSize:"0.9rem"},children:[t.jsx("strong",{style:{color:i.navy},children:"Monto:"})," $",(e.amount||0).toLocaleString()]}),t.jsxs("div",{style:{fontSize:"0.9rem"},children:[t.jsx("strong",{style:{color:i.navy},children:"Sector:"})," ",e.sector]})]}),t.jsxs("div",{style:{background:i.bg,padding:"0.75rem",borderRadius:"6px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("p",{style:{color:i.textMuted,fontSize:"0.7rem",margin:"0 0 0.25rem 0"},children:"Docs"}),t.jsx("p",{style:{color:i.navy,fontWeight:800,fontSize:"1.1rem",margin:0},children:((d=e.documents)==null?void 0:d.length)||0})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("p",{style:{color:i.textMuted,fontSize:"0.7rem",margin:"0 0 0.25rem 0"},children:"Reqs"}),t.jsx("p",{style:{color:i.navy,fontWeight:800,fontSize:"1.1rem",margin:0},children:((l=e.requirements)==null?void 0:l.length)||0})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("p",{style:{color:i.textMuted,fontSize:"0.7rem",margin:"0 0 0.25rem 0"},children:"Msgs"}),t.jsx("p",{style:{color:i.navy,fontWeight:800,fontSize:"1.1rem",margin:0},children:((h=e.messages)==null?void 0:h.length)||0})]})]}),t.jsxs("p",{style:{color:i.textMuted,fontSize:"0.75rem",margin:0},children:["Creado: ",new Date(e.createdAt).toLocaleDateString()]})]},e.id)})]}),o&&t.jsxs("div",{style:{background:i.white,border:`2px solid ${i.gold}`,borderRadius:"10px",padding:"2rem",boxShadow:"0 4px 16px rgba(201, 168, 76, 0.2)"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"1.5rem"},children:[t.jsxs("div",{children:[t.jsx("h2",{style:{color:i.navy,margin:0,marginBottom:"0.5rem"},children:o.title}),t.jsxs("p",{style:{color:i.textMuted,margin:0,fontSize:"0.9rem"},children:["ID: ",o.id]})]}),t.jsx("div",{style:{display:"flex",gap:"0.75rem"},children:["activo","pausado","cerrado"].map(e=>t.jsx("button",{onClick:()=>M(o.id,e),style:{padding:"0.5rem 1rem",background:o.status===e?i.gold:i.bg,color:o.status===e?i.navy:i.text,border:`1px solid ${i.border}`,borderRadius:"6px",fontWeight:700,cursor:"pointer",fontSize:"0.85rem",textTransform:"capitalize"},children:e},e))})]}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"},children:[["Rol en este expediente",v(o)],["Solicitante",o.solicitanteName],["Otorgante",o.otorganteName],["Sector",o.sector],["Monto solicitado",`$${(o.amount||0).toLocaleString()}`],["Estado",o.status]].map(([e,d])=>t.jsxs("div",{style:{background:i.bg,padding:"1rem",borderRadius:"8px"},children:[t.jsx("p",{style:{color:i.textMuted,fontSize:"0.85rem",margin:"0 0 0.5rem 0"},children:e}),t.jsx("p",{style:{color:i.navy,fontWeight:700,fontSize:"1rem",margin:0},children:d})]},e))}),o.description&&t.jsxs("div",{style:{background:i.bg,padding:"1rem",borderRadius:"8px",marginBottom:"1.5rem",borderLeft:`3px solid ${i.gold}`},children:[t.jsx("p",{style:{color:i.textMuted,fontSize:"0.85rem",margin:"0 0 0.5rem 0"},children:"Descripción"}),t.jsx("p",{style:{color:i.text,margin:0,lineHeight:1.6},children:o.description})]}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem",marginTop:"1.5rem"},children:[["📄 Documentos",((E=o.documents)==null?void 0:E.length)||0,"Archivos cargados"],["📋 Requerimientos",(($=o.requirements)==null?void 0:$.length)||0,"Solicitudes pendientes"],["💬 Mensajes",((D=o.messages)==null?void 0:D.length)||0,"Comunicaciones"]].map(([e,d,l])=>t.jsxs("div",{style:{background:i.bg,padding:"1rem",borderRadius:"8px",textAlign:"center",borderTop:`3px solid ${i.gold}`},children:[t.jsx("p",{style:{color:i.navy,fontSize:"1.8rem",margin:"0 0 0.25rem 0"},children:e}),t.jsx("p",{style:{color:i.navy,fontWeight:800,fontSize:"1.5rem",margin:"0 0 0.25rem 0"},children:d}),t.jsx("p",{style:{color:i.textMuted,fontSize:"0.85rem",margin:0},children:l})]},l))}),t.jsx("button",{onClick:()=>z(o.id),disabled:u===o.id,style:{width:"100%",marginTop:"1.5rem",padding:"0.75rem 1rem",background:u===o.id?i.textMuted:i.gold,color:i.navy,border:"none",borderRadius:"8px",fontWeight:700,cursor:u===o.id?"not-allowed":"pointer",fontSize:"0.95rem",opacity:u===o.id?.7:1,transition:"all 0.2s"},onMouseEnter:e=>{u!==o.id&&(e.currentTarget.style.background="#B8860B")},onMouseLeave:e=>{u!==o.id&&(e.currentTarget.style.background=i.gold)},children:u===o.id?"📥 Generando...":"📥 Descargar expediente como PDF"}),t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"#E3F2FD",borderRadius:"8px",borderLeft:`3px solid ${i.blue}`,color:i.blue,fontSize:"0.9rem"},children:[t.jsxs("p",{style:{margin:0,fontWeight:700},children:["ℹ️ Este es el expediente que vincula tu actividad con ",v(o)==="Solicitante"?"el Otorgante":"el Solicitante"]}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.85rem"},children:"Documentos, requerimientos y mensajes se vinculan automáticamente a este expediente"})]})]})]})}export{et as default};
