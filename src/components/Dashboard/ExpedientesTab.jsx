import { error } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import {
  getExpedientesForUser,
  createDemoExpediente,
  updateExpediente as updateExpedienteDemo,
  getExpediente as getExpedienteDemo
} from "../../services/expedienteService";
import { getDocumentsByExpediente } from "../../services/documentService";
import { getRequirementsByExpediente } from "../../services/requirementServiceV2";
import { getConversationForUser } from "../../services/messagingServiceV2";
import { ordersAPI, otorganteAPI, documentsAPI, informationRequestsAPI, messagingAPI } from "../../services/api";
import { generateExpedientePDF } from "../../services/pdfExportService";
import { searchExpedientes } from "../../services/searchService";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

// Un expediente real puede aparecer como dueño (Solicitante, via ordersAPI)
// o como otorgante autorizado (via otorganteAPI.pipeline() + data_room_shares
// aceptado) — el backend no tiene el concepto simetrico "mi expediente" que
// si tenia el IndexedDB falso, asi que se piden ambas fuentes y se etiqueta
// cada resultado con su rol real.
function mapOwnedOrder(order) {
  const metadata = order.metadata || {};
  return {
    id: order.id,
    title: order.project_name || metadata.projectName || order.case_number || 'Expediente',
    status: order.stage === 'cerrado' ? 'cerrado' : 'activo',
    amount: Number(order.requested_amount || order.amount || 0),
    sector: metadata.sector || '—',
    solicitanteName: metadata.companyName || '—',
    otorganteName: '—',
    role: 'owner',
    createdAt: order.created_at,
    documentsCount: null,
    requirementsCount: null,
    messagesCount: null
  };
}

function mapSharedItem(item) {
  const order = item.order || {};
  const metadata = order.metadata || {};
  return {
    id: order.id,
    title: order.project_name || metadata.projectName || order.case_number || 'Expediente',
    status: order.stage === 'cerrado' ? 'cerrado' : 'activo',
    amount: Number(order.requested_amount || order.amount || 0),
    sector: metadata.sector || '—',
    solicitanteName: metadata.companyName || '—',
    otorganteName: item.share?.recipientName || '—',
    role: 'funder',
    createdAt: order.created_at,
    documentsCount: item.documentsCount ?? null,
    requirementsCount: null,
    messagesCount: null
  };
}

export default function ExpedientesTab() {
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const isDemo = Boolean(user?.demo);

  const [expedientes, setExpedientes] = useState([]);
  const [filteredExpedientes, setFilteredExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingId, setExportingId] = useState(null);

  // Cargar expedientes
  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadDemo = async () => {
      try {
        let exps = await getExpedientesForUser(user.id);
        if (exps.length === 0) {
          const demoExp = await createDemoExpediente();
          exps = [demoExp];
          addNotification(L('Expediente demo creado', 'Demo compliance file created'), 'info');
        }
        if (active) setExpedientes(exps);
      } catch (err) {
        error("SVC", 'Error loading demo expedientes:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadReal = async () => {
      try {
        const [ownedResult, sharedResult] = await Promise.allSettled([
          ordersAPI.list(),
          otorganteAPI.pipeline()
        ]);
        const owned = ownedResult.status === 'fulfilled' ? (ownedResult.value.data || []) : [];
        const shared = sharedResult.status === 'fulfilled' ? (sharedResult.value.data || []) : [];
        if (active) setExpedientes([...owned.map(mapOwnedOrder), ...shared.map(mapSharedItem)]);
      } catch (err) {
        error("SVC", 'Error loading real expedientes:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (isDemo) loadDemo(); else loadReal();
    return () => { active = false; };
  }, [user, isDemo]);

  // Filtrar expedientes por búsqueda
  useEffect(() => {
    let active = true;
    if (searchQuery.trim() === "") {
      setFilteredExpedientes(expedientes);
    } else {
      searchExpedientes(expedientes, searchQuery).then((filtered) => {
        if (active) setFilteredExpedientes(filtered);
      });
    }
    return () => { active = false; };
  }, [expedientes, searchQuery]);

  const handleSelectExpediente = async (exp) => {
    setSelectedExp(exp);
    if (isDemo) return;

    try {
      const [docsResult, reqsResult, msgsResult] = await Promise.allSettled([
        documentsAPI.list(exp.id),
        informationRequestsAPI.list(exp.id),
        messagingAPI.list(exp.id)
      ]);
      setSelectedExp((prev) => (prev?.id !== exp.id ? prev : {
        ...prev,
        documentsCount: docsResult.status === 'fulfilled' ? (docsResult.value.data || []).length : prev.documentsCount,
        requirementsCount: reqsResult.status === 'fulfilled' ? (reqsResult.value.data || []).length : prev.requirementsCount,
        messagesCount: msgsResult.status === 'fulfilled' ? (msgsResult.value.data || []).length : prev.messagesCount
      }));
    } catch (err) {
      error("SVC", 'Error cargando detalle del expediente real:', err);
    }
  };

  const handleExportPDF = async (exp) => {
    try {
      setExportingId(exp.id);

      if (isDemo) {
        const fullExp = await getExpedienteDemo(exp.id);
        const docs = await getDocumentsByExpediente(exp.id);
        const reqs = await getRequirementsByExpediente(exp.id);
        const msgs = await getConversationForUser(user.id, exp.id) || [];
        await generateExpedientePDF(fullExp, reqs, docs, msgs);
      } else {
        const [docsResult, reqsResult, msgsResult] = await Promise.allSettled([
          documentsAPI.list(exp.id),
          informationRequestsAPI.list(exp.id),
          messagingAPI.list(exp.id)
        ]);
        const docs = docsResult.status === 'fulfilled' ? (docsResult.value.data || []) : [];
        const reqs = reqsResult.status === 'fulfilled' ? (reqsResult.value.data || []) : [];
        const msgs = msgsResult.status === 'fulfilled' ? (msgsResult.value.data || []) : [];
        await generateExpedientePDF(exp, reqs, docs, msgs);
      }

      addNotification(L(`📥 Expediente ${exp.id} descargado`, `📥 Compliance file ${exp.id} downloaded`), 'success');
    } catch (err) {
      error("SVC", 'Error exportando PDF:', err);
      addNotification(L('Error al exportar PDF', 'Error exporting PDF'), 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleUpdateStatus = async (exp, newStatus) => {
    try {
      if (isDemo) {
        const updated = await updateExpedienteDemo(exp.id, { status: newStatus });
        setExpedientes(expedientes.map(e => e.id === exp.id ? updated : e));
        setSelectedExp(updated);
      } else {
        if (exp.role !== 'owner') {
          addNotification(L('Solo el solicitante dueño del expediente puede cambiar su estado.', 'Only the applicant who owns the file can change its status.'), 'error');
          return;
        }
        await ordersAPI.updateInstitutional(exp.id, { stage: newStatus === 'cerrado' ? 'cerrado' : 'captura' });
        const updated = { ...exp, status: newStatus };
        setExpedientes(expedientes.map(e => e.id === exp.id ? updated : e));
        setSelectedExp(updated);
      }
      addNotification(`${L('Expediente actualizado a:', 'Compliance file updated to:')} ${newStatus}`, 'success');
    } catch (err) {
      error("SVC", 'Error updating expediente:', err);
      addNotification(L('Error al actualizar expediente', 'Error updating compliance file'), 'error');
    }
  };

  const getMiRol = (expediente) => {
    if (isDemo) {
      if (expediente.solicitanteId === user?.id) return L('Solicitante', 'Applicant');
      if (expediente.otorganteId === user?.id) return L('Otorgante', 'Funding Provider');
      return L('Desconocido', 'Unknown');
    }
    return expediente.role === 'owner' ? L('Solicitante', 'Applicant') : L('Otorgante', 'Funding Provider');
  };

  // Modo demo trae arreglos completos (documents/requirements/messages);
  // modo real trae solo el conteo (documentsCount/...), cargado bajo demanda
  // en handleSelectExpediente para no hacer N+1 llamadas en la lista.
  const formatCount = (exp, arrayField, countField) => {
    if (Array.isArray(exp[arrayField])) return exp[arrayField].length;
    if (exp[countField] != null) return exp[countField];
    return '—';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activo': return COLORS.green;
      case 'pausado': return COLORS.amber;
      case 'cerrado': return '#C62828';
      default: return COLORS.navy;
    }
  };

  if (loading) return <p>{L("Cargando expedientes...", "Loading compliance files...")}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            📋 {L("Mis Expedientes", "My Compliance Files")}
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            {L("Órdenes vinculadas entre Solicitante y Otorgante. Tienes acceso a", "Orders linked between Applicant and Funding Provider. You have access to")} {expedientes.length} {L("expediente(s).", "compliance file(s).")}
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder={L("🔍 Busca por nombre, ID, sector...", "🔍 Search by name, ID, sector...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.75rem 1rem",
            border: `2px solid ${COLORS.border}`,
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: 500
          }}
        />
        {searchQuery && (
          <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0.5rem 0 0 0" }}>
            📊 {filteredExpedientes.length} {L("resultado(s)", "result(s)")}
          </p>
        )}
      </div>

      {/* LISTA DE EXPEDIENTES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {filteredExpedientes.length === 0 && (
          <p style={{ color: COLORS.textMuted, gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
            {L("No hay expedientes que coincidan con la búsqueda", "No compliance files match your search")}
          </p>
        )}
        {filteredExpedientes.map((exp) => (
          <div
            key={exp.id}
            onClick={() => handleSelectExpediente(exp)}
            style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              border: selectedExp?.id === exp.id ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "1.5rem",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: selectedExp?.id === exp.id ? "0 4px 16px rgba(201, 168, 76, 0.3)" : "0 2px 8px rgba(0,0,0,0.08)"
            }}
            onMouseEnter={(e) => {
              if (selectedExp?.id !== exp.id) {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedExp?.id !== exp.id) {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ color: COLORS.navy, margin: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                  {exp.title}
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {exp.id}
                </p>
              </div>
              <span style={{
                display: "inline-block",
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                background: `${getStatusColor(exp.status)}33`,
                color: getStatusColor(exp.status),
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "capitalize"
              }}>
                {L(exp.status, exp.status)}
              </span>
            </div>

            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>{L("Mi rol:", "My role:")}</strong> {getMiRol(exp)}
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>{L("Monto:", "Amount:")}</strong> ${(exp.amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>{L("Sector:", "Sector:")}</strong> {exp.sector}
              </div>
            </div>

            <div style={{
              background: COLORS.bg,
              padding: "0.75rem",
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Docs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {formatCount(exp, 'documents', 'documentsCount')}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Reqs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {formatCount(exp, 'requirements', 'requirementsCount')}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Msgs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {formatCount(exp, 'messages', 'messagesCount')}
                </p>
              </div>
            </div>

            <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: 0 }}>
              {L("Creado:", "Created:")} {new Date(exp.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* DETALLE EXPEDIENTE */}
      {selectedExp && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          border: `2px solid ${COLORS.gold}`,
          borderRadius: "10px",
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(201, 168, 76, 0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ color: COLORS.navy, margin: 0, marginBottom: "0.5rem" }}>
                {selectedExp.title}
              </h2>
              <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.9rem" }}>
                ID: {selectedExp.id}
              </p>
            </div>
            {(isDemo || selectedExp.role === 'owner') && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(isDemo ? ['activo', 'pausado', 'cerrado'] : ['activo', 'cerrado']).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(selectedExp, status)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: selectedExp.status === status ? COLORS.gold : COLORS.bg,
                      color: selectedExp.status === status ? COLORS.navy : COLORS.text,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      textTransform: "capitalize"
                    }}
                  >
                    {L(status, status)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            {[
              [L("Rol en este expediente", "Role in this compliance file"), getMiRol(selectedExp)],
              [L("Solicitante", "Applicant"), selectedExp.solicitanteName],
              [L("Otorgante", "Funding Provider"), selectedExp.otorganteName],
              [L("Sector", "Sector"), selectedExp.sector],
              [L("Monto solicitado", "Requested Amount"), `$${(selectedExp.amount || 0).toLocaleString()}`],
              [L("Estado", "Status"), L(selectedExp.status, selectedExp.status)]
            ].map(([label, value]) => (
              <div key={label} style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
                  {label}
                </p>
                <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {selectedExp.description && (
            <div style={{
              background: COLORS.bg,
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              borderLeft: `3px solid ${COLORS.gold}`
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
                {L("Descripción", "Description")}
              </p>
              <p style={{ color: COLORS.text, margin: 0, lineHeight: 1.6 }}>
                {selectedExp.description}
              </p>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginTop: "1.5rem"
          }}>
            {[
              [`📄 ${L("Documentos", "Documents")}`, formatCount(selectedExp, 'documents', 'documentsCount'), L("Archivos cargados", "Uploaded files")],
              [`📋 ${L("Requerimientos", "Requirements")}`, formatCount(selectedExp, 'requirements', 'requirementsCount'), L("Solicitudes pendientes", "Pending requests")],
              [`💬 ${L("Mensajes", "Messages")}`, formatCount(selectedExp, 'messages', 'messagesCount'), L("Comunicaciones", "Communications")]
            ].map(([icon, count, label]) => (
              <div key={label} style={{
                background: COLORS.bg,
                padding: "1rem",
                borderRadius: "8px",
                textAlign: "center",
                borderTop: `3px solid ${COLORS.gold}`
              }}>
                <p style={{ color: COLORS.navy, fontSize: "1.8rem", margin: "0 0 0.25rem 0" }}>
                  {icon}
                </p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.5rem", margin: "0 0 0.25rem 0" }}>
                  {count}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* BOTÓN DE DESCARGAR PDF */}
          <button
            onClick={() => handleExportPDF(selectedExp)}
            disabled={exportingId === selectedExp.id}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "0.75rem 1rem",
              background: exportingId === selectedExp.id ? COLORS.textMuted : COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: exportingId === selectedExp.id ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              opacity: exportingId === selectedExp.id ? 0.7 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (exportingId !== selectedExp.id) {
                e.currentTarget.style.background = "#B8860B";
              }
            }}
            onMouseLeave={(e) => {
              if (exportingId !== selectedExp.id) {
                e.currentTarget.style.background = COLORS.gold;
              }
            }}
          >
            {exportingId === selectedExp.id ? L("📥 Generando...", "📥 Generating...") : L("📥 Descargar expediente como PDF", "📥 Download compliance file as PDF")}
          </button>

          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#E3F2FD",
            borderRadius: "8px",
            borderLeft: `3px solid ${COLORS.blue}`,
            color: COLORS.blue,
            fontSize: "0.9rem"
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              ℹ️ {L("Este es el expediente que vincula tu actividad con", "This is the compliance file that links your activity with")} {getMiRol(selectedExp) === L("Solicitante", "Applicant") ? L("el Otorgante", "the Funding Provider") : L("el Solicitante", "the Applicant")}
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>
              {L("Documentos, requerimientos y mensajes se vinculan automáticamente a este expediente", "Documents, requirements and messages are automatically linked to this compliance file")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
