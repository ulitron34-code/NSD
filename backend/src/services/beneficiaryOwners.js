// Beneficiarios controladores (UBO - Ultimate Beneficial Owners).
//
// Se guardan dentro de service_orders.metadata.beneficiaryOwners (jsonb) en
// vez de una tabla dedicada: evita una migracion de Supabase para una
// estructura simple por expediente, y reutiliza el mismo patron ya probado
// para declaredPublicPosition. Si el volumen crece (auditoria cruzada entre
// expedientes, reportes regulatorios agregados) si conviene una tabla propia.
import { screenNameAgainstOfac } from './ofacScreening.js';
import { screenCargoAgainstPepCatalog, relationshipExtendsPepStatus } from './pepScreening.js';

export function normalizeBeneficiaryOwner(raw = {}) {
  const fullName = String(raw.fullName || '').trim();
  const ownershipPercentage = raw.ownershipPercentage === '' || raw.ownershipPercentage == null
    ? null
    : Number(raw.ownershipPercentage);

  return {
    fullName,
    ownershipPercentage: Number.isFinite(ownershipPercentage) ? ownershipPercentage : null,
    nationality: String(raw.nationality || '').trim() || null,
    declaredPublicPosition: String(raw.declaredPublicPosition || '').trim() || null,
    declaredPublicPositionRelationship: String(raw.declaredPublicPositionRelationship || '').trim() || null
  };
}

export function normalizeBeneficiaryOwnerList(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(normalizeBeneficiaryOwner)
    .filter((owner) => owner.fullName);
}

// Corre OFAC (por nombre) y PEP (por cargo declarado) sobre cada beneficiario
// controlador. Mismo criterio que regulatoryValidation.js: un hit en
// cualquiera de los dos fuerza revision manual, nunca se autoaprueba.
export function screenBeneficiaryOwners(owners = []) {
  return owners.map((owner) => {
    const ofacResult = screenNameAgainstOfac(owner.fullName);
    const pepResult = screenCargoAgainstPepCatalog(owner.declaredPublicPosition, {
      relationship: owner.declaredPublicPositionRelationship
    });
    const relationshipInPepScope = relationshipExtendsPepStatus(owner.declaredPublicPositionRelationship);

    const hasHit = ofacResult.status === 'hit' || pepResult.status === 'hit';

    return {
      fullName: owner.fullName,
      ownershipPercentage: owner.ownershipPercentage,
      nationality: owner.nationality,
      ofac: ofacResult,
      pep: pepResult,
      relationshipInPepScope,
      status: hasHit ? 'review_required' : 'clear'
    };
  });
}
