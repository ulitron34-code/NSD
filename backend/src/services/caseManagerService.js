// NAGMAR Case Manager — CRUD de casos de screening en Supabase.
// Usa supabaseAdmin (service role) para operar con user_id explícito.
import { supabaseAdmin } from '../config/supabase.js';
import { screenEntityFull } from './regulatoryGateway.js';

// Ejecuta un screening completo y persiste el caso en nagmar_cases.
export async function createScreeningCase({ userId, name, country }) {
  const result = await screenEntityFull(name, country || null);
  const { data, error } = await supabaseAdmin
    .from('nagmar_cases')
    .insert({
      user_id: userId,
      name,
      country: country || null,
      verdict: result.verdict,
      full_result: result,
      status: 'pending'
    })
    .select()
    .single();
  if (error) throw error;
  return { case: data, result };
}

// Lista los casos del usuario con paginacion y filtros opcionales.
export async function listCases({ userId, page = 1, limit = 20, verdict, status }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabaseAdmin
    .from('nagmar_cases')
    .select('id, name, country, verdict, status, dictamen, notes, created_at, updated_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (verdict) query = query.eq('verdict', verdict);
  if (status) query = query.eq('status', status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { cases: data || [], total: count ?? 0, page, limit };
}

// Devuelve un caso completo con su historial de acciones.
export async function getCase({ userId, caseId }) {
  const { data: caseData, error } = await supabaseAdmin
    .from('nagmar_cases')
    .select('*')
    .eq('id', caseId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;

  const { data: actions, error: actionsError } = await supabaseAdmin
    .from('nagmar_case_actions')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (actionsError) throw actionsError;

  return { ...caseData, actions: actions || [] };
}

// Registra una accion del analista sobre el caso (falso positivo, confirmar, escalar, nota).
export async function addCaseAction({ userId, caseId, action, source, entityName, reason }) {
  const { error: checkError } = await supabaseAdmin
    .from('nagmar_cases')
    .select('id')
    .eq('id', caseId)
    .eq('user_id', userId)
    .single();
  if (checkError) throw new Error('Caso no encontrado o acceso no permitido');

  const { data, error } = await supabaseAdmin
    .from('nagmar_case_actions')
    .insert({
      case_id: caseId,
      user_id: userId,
      action,
      source: source || null,
      entity_name: entityName || null,
      reason: reason || null
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Actualiza el dictamen, notas y/o estado del caso.
export async function resolveCase({ userId, caseId, dictamen, notes, status }) {
  const updates = { updated_at: new Date().toISOString() };
  if (dictamen !== undefined) updates.dictamen = dictamen;
  if (notes !== undefined) updates.notes = notes;
  if (status) updates.status = status;
  if (status === 'resolved') {
    updates.resolved_by = userId;
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('nagmar_cases')
    .update(updates)
    .eq('id', caseId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
