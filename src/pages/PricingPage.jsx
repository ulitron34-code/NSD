import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { uiText, translateCopy } from '../utils/runtimeCopy';
import { PLANS, getPlanInfo, getDisplayPrice, hasFeature, checkLimits } from '../services/pricingService';
import { useAuth } from '../hooks/useAuth';
import { error, debug, info } from '../utils/logger';

export default function PricingPage() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const L = (es, en) => uiText(i18n, es, en);
  const isEn = String(i18n.language).toLowerCase().startsWith('en');
  
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(PLANS.GROWTH);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Demo usage stats
  const [usage] = useState({
    expedientes: 12,
    usuarios: 5,
    documentosMes: 234
  });

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      info('Pricing', `Upgraded to ${selectedPlan.name[isEn ? 'en' : 'es']}`);
      setCurrentPlan(selectedPlan);
      setShowUpgradeModal(false);
    } catch (err) {
      error('Pricing', 'Upgrade failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.white} 100%)`,
      padding: '2rem 1rem'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '3rem' }}>
        <p style={{ 
          color: COLORS.gold, 
          fontSize: '0.85rem', 
          fontWeight: 900, 
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}>
          {L('Planes y Precios', 'Plans & Pricing')}
        </p>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          color: COLORS.navy, 
          marginBottom: '1rem',
          fontWeight: 900
        }}>
          {L('Elige tu plan de compliance', 'Choose your compliance plan')}
        </h1>
        <p style={{ 
          color: COLORS.textMuted, 
          fontSize: '1.1rem', 
          maxWidth: '600px', 
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          {L(
            'Escala tu preparación de expedientes según crezca tu necesidad. Sin contratos complejos, cancela cuando quieras.',
            'Scale your file preparation as your needs grow. No complex contracts, cancel anytime.'
          )}
        </p>

        {/* Currency Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginTop: '1.5rem' 
        }}>
          <button
            onClick={() => setCurrency('USD')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: `2px solid ${currency === 'USD' ? COLORS.navy : COLORS.border}`,
              background: currency === 'USD' ? COLORS.navy : COLORS.white,
              color: currency === 'USD' ? COLORS.white : COLORS.text,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            💵 USD
          </button>
          <button
            onClick={() => setCurrency('MXN')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: `2px solid ${currency === 'MXN' ? COLORS.navy : COLORS.border}`,
              background: currency === 'MXN' ? COLORS.navy : COLORS.white,
              color: currency === 'MXN' ? COLORS.white : COLORS.text,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🇲🇽 MXN
          </button>
        </div>
      </div>

      {/* Current Plan Banner */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 2rem',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1B3A5C 100%)`,
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        color: COLORS.white,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.25rem' }}>
            {L('Tu plan actual', 'Your current plan')}
          </p>
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
            {currentPlan.name[isEn ? 'en' : 'es']} ✓
          </h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
            {L('Próxima facturación en 23 días', 'Next billing in 23 days')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{L('Uso actual', 'Current usage')}</p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span>📁 {usage.expedientes}/25</span>
            <span>👥 {usage.usuarios}/10</span>
            <span>📄 {usage.documentosMes}/500</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {Object.values(PLANS).map((plan) => {
          const isCurrentPlan = plan.id === currentPlan.id;
          const isPopular = plan.popular;
          const price = getDisplayPrice(plan, currency);
          const features = plan.features.filter(f => f.included);
          const excludedFeatures = plan.features.filter(f => !f.included);

          return (
            <div 
              key={plan.id}
              style={{
                background: COLORS.white,
                borderRadius: '16px',
                border: isPopular ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                boxShadow: isPopular ? `0 8px 32px rgba(201, 162, 39, 0.25)` : COLORS.shadowMd,
                overflow: 'hidden',
                position: 'relative',
                transform: isPopular ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s'
              }}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '-30px',
                  background: COLORS.gold,
                  color: COLORS.navy,
                  padding: '0.35rem 2.5rem',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  transform: 'rotate(45deg)',
                  textTransform: 'uppercase'
                }}>
                  {L('Popular', 'Popular')}
                </div>
              )}

              {/* Header */}
              <div style={{ 
                padding: '1.75rem 1.5rem',
                borderBottom: `1px solid ${COLORS.border}`,
                background: isPopular ? `linear-gradient(135deg, ${COLORS.navy} 0%, #1B3A5C 100%)` : COLORS.bg
              }}>
                <h3 style={{ 
                  color: isPopular ? COLORS.white : COLORS.navy, 
                  fontSize: '1.4rem', 
                  marginBottom: '0.5rem' 
                }}>
                  {plan.name[isEn ? 'en' : 'es']}
                </h3>
                <p style={{ 
                  color: isPopular ? 'rgba(255,255,255,0.8)' : COLORS.textMuted, 
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}>
                  {plan.description[isEn ? 'en' : 'es']}
                </p>
              </div>

              {/* Price */}
              <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: COLORS.navy }}>
                    {price.formatted}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: '0.9rem' }}>
                    /{L('mes', 'month')}
                  </span>
                </div>
                {currency === 'MXN' && (
                  <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    ≈ ${Math.round(plan.price.USD * 17.5).toLocaleString()} MXN {L('(IVA incluido)', '(VAT included)')}
                  </p>
                )}
              </div>

              {/* Features */}
              <div style={{ padding: '1.5rem' }}>
                <p style={{ 
                  color: COLORS.gold, 
                  fontSize: '0.75rem', 
                  fontWeight: 900, 
                  textTransform: 'uppercase',
                  marginBottom: '1rem'
                }}>
                  {L('Incluye', 'Includes')}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {features.map((feature, idx) => (
                    <li key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem',
                      marginBottom: '0.85rem',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ 
                        color: COLORS.green, 
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}>
                        ✓
                      </span>
                      <span style={{ color: COLORS.text }}>
                        {feature[isEn ? 'en' : 'es']}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Show what's NOT included */}
                {excludedFeatures.length > 0 && plan.id !== PLANS.ENTERPRISE.id && (
                  <details style={{ marginTop: '1rem' }}>
                    <summary style={{ 
                      color: COLORS.textMuted, 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      padding: '0.5rem 0'
                    }}>
                      +{excludedFeatures.length} {L('características avanzadas', 'advanced features')}
                    </summary>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: '0.5rem 0 0 1.5rem', 
                      margin: 0 
                    }}>
                      {excludedFeatures.map((feature, idx) => (
                        <li key={idx} style={{ 
                          color: COLORS.textMuted, 
                          fontSize: '0.85rem',
                          marginBottom: '0.5rem'
                        }}>
                          ✗ {feature[isEn ? 'en' : 'es']}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              {/* CTA */}
              <div style={{ padding: '1.5rem', borderTop: `1px solid ${COLORS.border}` }}>
                {isCurrentPlan ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: COLORS.bg,
                      color: COLORS.textMuted,
                      fontWeight: 700,
                      cursor: 'not-allowed'
                    }}
                  >
                    {L('Plan actual', 'Current plan')}
                  </button>
                ) : plan.id === PLANS.ENTERPRISE.id || plan.price.USD > currentPlan.price.USD ? (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: isPopular ? COLORS.gold : COLORS.navy,
                      color: isPopular ? COLORS.navy : COLORS.white,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {L('Actualizar a', 'Upgrade to')} {plan.name[isEn ? 'en' : 'es']}
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.textMuted,
                      fontWeight: 700,
                      cursor: 'not-allowed'
                    }}
                  >
                    {L('Plan inferior', 'Downgrade')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '4rem auto 0',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: COLORS.navy, 
          fontSize: '1.8rem',
          marginBottom: '2rem'
        }}>
          {L('Preguntas frecuentes', 'Frequently Asked Questions')}
        </h2>
        
        <div style={{ textAlign: 'left' }}>
          {[
            {
              q: L('¿Puedo cambiar de plan en cualquier momento?', 'Can I change plans anytime?'),
              a: L('Sí, puedes actualizar o downgrade tu plan en cualquier momento. Los cambios se aplican inmediatamente.', 'Yes, you can upgrade or downgrade your plan anytime. Changes take effect immediately.')
            },
            {
              q: L('¿Qué pasa si excedo los límites?', 'What if I exceed my limits?'),
              a: L('Te notificaremos cuando alcances el 80% de tus límites. Puedes actualizar tu plan o esperar al siguiente ciclo de facturación.', 'We will notify you when you reach 80% of your limits. You can upgrade your plan or wait for the next billing cycle.')
            },
            {
              q: L('¿Hay descuentos por anuales?', 'Are there annual discounts?'),
              a: L('Sí, pagando anualmente obtienes 2 meses gratis. Contacta a ventas para más información.', 'Yes, paying annually gets you 2 months free. Contact sales for more information.')
            },
            {
              q: L('¿Cómo funcionan los pagos?', 'How do payments work?'),
              a: L('Procesamos pagos de forma segura con Stripe. Aceptamos tarjetas de crédito, débito y transferencias bancarias.', 'We process payments securely with Stripe. We accept credit cards, debit cards and bank transfers.')
            },
            {
              q: L('¿Ofrecen pruebas gratuitas?', 'Do you offer free trials?'),
              a: L('Sí, todos los planes incluyen 14 días de prueba gratuita sin compromiso.', 'Yes, all plans include 14 days of free trial with no commitment.')
            }
          ].map((faq, idx) => (
            <details key={idx} style={{ 
              marginBottom: '1rem',
              background: COLORS.white,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: COLORS.shadowSm
            }}>
              <summary style={{ 
                padding: '1.25rem 1.5rem',
                fontWeight: 700,
                color: COLORS.navy,
                cursor: 'pointer',
                listStyle: 'none'
              }}>
                {faq.q}
              </summary>
              <p style={{ 
                padding: '0 1.5rem 1.25rem',
                color: COLORS.textMuted,
                lineHeight: 1.6,
                margin: 0
              }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '4rem auto',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1B3A5C 100%)`,
        borderRadius: '20px',
        padding: '3rem 2rem',
        textAlign: 'center',
        color: COLORS.white
      }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
          {L('¿Necesitas un plan custom?', 'Need a custom plan?')}
        </h2>
        <p style={{ opacity: 0.85, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {L(
            'Para instituciones financieras, fondos de inversión o casos de uso enterprise con necesidades específicas, podemos crear un paquete personalizado.',
            'For financial institutions, investment funds or enterprise use cases with specific needs, we can create a customized package.'
          )}
        </p>
        <a 
          href="mailto:sales@nsd.com?subject=Enterprise Plan Request"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: COLORS.gold,
            color: COLORS.navy,
            fontWeight: 900,
            textDecoration: 'none',
            borderRadius: '10px',
            transition: 'all 0.2s'
          }}
        >
          {L('Contactar a ventas', 'Contact sales')} →
        </a>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: COLORS.navy, marginBottom: '1rem' }}>
              {L('Confirmar actualización', 'Confirm upgrade')}
            </h3>
            <p style={{ color: COLORS.text, marginBottom: '1.5rem' }}>
              {L(
                `¿Quieres actualizar tu plan a ${selectedPlan.name[isEn ? 'en' : 'es']}?`,
                `Do you want to upgrade to ${selectedPlan.name[isEn ? 'en' : 'es']}?`
              )}
            </p>
            <div style={{ 
              background: COLORS.bg, 
              borderRadius: '10px', 
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontWeight: 700, color: COLORS.navy }}>
                {selectedPlan.name[isEn ? 'en' : 'es']}
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: COLORS.gold }}>
                {getDisplayPrice(selectedPlan, currency).formatted}/{L('mes', 'month')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `2px solid ${COLORS.border}`,
                  background: COLORS.white,
                  color: COLORS.text,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {L('Cancelar', 'Cancel')}
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? COLORS.textMuted : COLORS.navy,
                  color: COLORS.white,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? L('Procesando...', 'Processing...') : L('Confirmar', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}