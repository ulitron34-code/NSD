import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { ordersAPI, paymentsAPI } from '../services/api';
import { COLORS } from '../utils/constants';
import { error, info, warn } from '../utils/logger';
import { BRAND } from '../config/brand';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const stripeFieldOptions = {
  style: {
    base: {
      fontSize: '17px',
      color: COLORS.text,
      lineHeight: '28px',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: COLORS.textMuted }
    },
    invalid: { color: '#C62828' }
  }
};

function StripeInput({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', color: COLORS.navy, fontWeight: 800, fontSize: '0.86rem', marginBottom: '0.45rem' }}>
        {label}
      </span>
      <div style={{
        minHeight: '54px',
        padding: '0.95rem 1rem',
        border: `1.5px solid ${COLORS.border}`,
        borderRadius: '8px',
        background: COLORS.bg,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%' }}>{children}</div>
      </div>
    </label>
  );
}

function CheckoutForm({ orderId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpressReady, setIsExpressReady] = useState(false);
  const [error, setError] = useState(null);
  const [currentPaymentIntentId, setCurrentPaymentIntentId] = useState(null);

  const completeOrder = async (paymentIntent) => {
    try {
      const confirmation = await paymentsAPI.confirmPayment(orderId, paymentIntent.id);
      info('Checkout', `Payment confirmed for order ${orderId}`);
      onSuccess(confirmation.data?.order || { id: orderId, status: 'paid', amount });
    } catch (err) {
      error('Checkout', 'Failed to confirm payment:', err);
      // Even if confirm fails, check if order was updated via webhook
      const status = await paymentsAPI.getStatus(orderId);
      if (status.data?.isPaid) {
        info('Checkout', 'Order marked as paid via webhook');
        onSuccess({ id: orderId, status: 'paid', amount });
      } else {
        onError(err.response?.data?.error || 'Failed to confirm order');
      }
    }
  };

  const handleExpressConfirm = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { data } = await paymentsAPI.createPaymentIntent(orderId);
      setCurrentPaymentIntentId(data.paymentIntentId);
      
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        redirect: 'if_required'
      });

      if (result.error) {
        setError(result.error.message || 'No se pudo completar el pago rápido');
        warn('Checkout', 'Express payment failed:', result.error.message);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await completeOrder(result.paymentIntent);
      } else if (result.paymentIntent?.status === 'requires_action') {
        // 3D Secure or other action required - wait for completion
        setError('Se requiere verificación adicional. Completa la verificación en la ventana emergente.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error de conexión';
      setError(errorMsg);
      error('Checkout', 'Express payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create payment intent
      const { data } = await paymentsAPI.createPaymentIntent(orderId);
      setCurrentPaymentIntentId(data.paymentIntentId);

      // 2. Confirm payment with card
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)
        }
      });

      if (result.error) {
        setError(result.error.message || 'No se pudo completar el pago');
        warn('Checkout', 'Card payment failed:', result.error.message);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        await completeOrder(result.paymentIntent);
      } else if (result.paymentIntent.status === 'requires_action') {
        setError('Se requiere verificación adicional. Completa la verificación en la ventana emergente.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error de conexión';
      setError(errorMsg);
      error('Checkout', 'Card payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (currentPaymentIntentId) {
      try {
        await paymentsAPI.cancelPaymentIntent(currentPaymentIntentId);
        info('Checkout', 'Payment intent canceled');
      } catch (err) {
        warn('Checkout', 'Failed to cancel payment intent:', err);
      }
    }
    navigate('/service-orders');
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div style={{
        padding: '2.25rem',
        background: 'white',
        borderRadius: '12px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <p style={{ color: COLORS.gold, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem' }}>
          Checkout seguro
        </p>
        <h2 style={{ color: COLORS.navy, marginBottom: '0.5rem' }}>Pagar ${amount} USD</h2>
        <p style={{ color: COLORS.textMuted, fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Ingresa los datos de tarjeta de prueba. El pago se procesa con Stripe y después se confirma la orden en {BRAND.name}.
        </p>

        {/* Express Checkout (Google Pay, PayPal) */}
        <div style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '10px',
          padding: '1rem',
          background: '#fff',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
            <div>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: '0.2rem' }}>Pago rápido</p>
              <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', lineHeight: 1.45 }}>
                Google Pay o PayPal aparecerán si están habilitados en Stripe y disponibles en este navegador.
              </p>
            </div>
            <span style={{ color: COLORS.gold, fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Plus
            </span>
          </div>
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              setIsExpressReady(Boolean(availablePaymentMethods));
            }}
            onConfirm={handleExpressConfirm}
            options={{
              buttonType: {
                googlePay: 'pay',
                paypal: 'paypal'
              },
              buttonTheme: {
                googlePay: 'black',
                paypal: 'gold'
              },
              buttonHeight: 48
            }}
          />
          {!isExpressReady && (
            <p style={{ color: COLORS.textMuted, fontSize: '0.78rem', lineHeight: 1.45, marginTop: '0.75rem' }}>
              Si no aparece un botón, usa tarjeta por ahora. En producción se activa desde el panel de Stripe.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <span style={{ height: '1px', flex: 1, background: COLORS.border }} />
          <span style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            O paga con tarjeta
          </span>
          <span style={{ height: '1px', flex: 1, background: COLORS.border }} />
        </div>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '0.75rem' }}>
          <StripeInput label="Número de tarjeta">
            <CardNumberElement options={{ ...stripeFieldOptions, showIcon: true }} />
          </StripeInput>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
            <StripeInput label="Vencimiento">
              <CardExpiryElement options={stripeFieldOptions} />
            </StripeInput>
            <StripeInput label="CVC">
              <CardCvcElement options={stripeFieldOptions} />
            </StripeInput>
          </div>
        </div>
        <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', marginBottom: '1rem' }}>
          Prueba: 4242 4242 4242 4242 / fecha futura / CVC cualquiera.
        </p>
        
        {error && (
          <div style={{ 
            background: '#FEF2F2', 
            border: '1px solid #EF4444', 
            borderRadius: '8px', 
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#991B1B', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            style={{
              flex: 1,
              padding: '1rem',
              background: COLORS.gold,
              color: COLORS.navy,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: (!stripe || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {isProcessing ? 'Procesando...' : 'Pagar y confirmar orden'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            style={{
              padding: '1rem 1.5rem',
              background: 'transparent',
              color: COLORS.textMuted,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            Cancelar
          </button>
        </div>

        {/* Security badges */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${COLORS.border}`
        }}>
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>🔒 Encriptado con SSL</span>
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>•</span>
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Powered by Stripe</span>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paidOrder, setPaidOrder] = useState(null);
  const [order, setOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const amountParam = searchParams.get('amount');
  const amount = order?.amount || amountParam;

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setOrderLoading(false);
        return;
      }

      try {
        const { data } = await ordersAPI.getById(orderId);
        setOrder(data);
        setOrderError('');
        
        // If already paid, redirect to success
        if (data.status === 'paid' || data.status === 'completed') {
          setPaidOrder({ id: orderId, status: data.status, amount: data.amount });
        }
      } catch (error) {
        setOrderError(error.response?.data?.error || 'No se pudo cargar la orden');
        error('Checkout', 'Failed to load order:', error);
      } finally {
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const handleSuccess = (orderData) => {
    setPaidOrder(orderData);
  };

  const handleError = (errorMsg) => {
    setOrderError(errorMsg);
  };

  if (!orderId) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '8rem 2rem' }}>
        <div style={{
          maxWidth: '620px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ color: COLORS.navy, fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            Orden inválida
          </h1>
          <p style={{ color: COLORS.textMuted, marginBottom: '1.5rem' }}>
            No se proporcionó un ID de orden válido.
          </p>
          <button 
            onClick={() => navigate('/service-orders')} 
            style={{ 
              padding: '0.9rem 1.2rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: COLORS.navy, 
              color: 'white', 
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Volver a mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (orderLoading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid ${COLORS.border}', 
            borderTopColor: COLORS.navy, 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: COLORS.textMuted }}>Cargando checkout...</p>
        </div>
      </div>
    );
  }

  if (orderError && !order) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '8rem 2rem 3rem' }}>
        <div style={{
          maxWidth: '620px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ color: COLORS.navy, fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            No pudimos abrir el checkout
          </h1>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {orderError}
          </p>
          <button 
            onClick={() => navigate('/service-orders')} 
            style={{ 
              padding: '0.9rem 1.2rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: COLORS.navy, 
              color: 'white', 
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Volver a mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (!amount) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '8rem 2rem 3rem' }}>
        <div style={{
          maxWidth: '620px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ color: COLORS.navy, fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            Orden inválida
          </h1>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            La orden no tiene un monto válido para procesar.
          </p>
          <button 
            onClick={() => navigate('/service-orders')} 
            style={{ 
              padding: '0.9rem 1.2rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: COLORS.navy, 
              color: 'white', 
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Volver a mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (!stripePublicKey) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '8rem 2rem 3rem' }}>
        <div style={{
          maxWidth: '620px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ color: COLORS.navy, fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            Checkout no configurado
          </h1>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Falta configurar VITE_STRIPE_PUBLIC_KEY en el entorno.
          </p>
          <button 
            onClick={() => navigate('/service-orders')} 
            style={{ 
              padding: '0.9rem 1.2rem', 
              borderRadius: '6px', 
              border: 'none', 
              background: COLORS.navy, 
              color: 'white', 
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Volver a mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (paidOrder) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '8rem 2rem 3rem' }}>
        <div style={{
          maxWidth: '620px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 18px 44px rgba(10,25,47,0.10)',
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#ECFDF5',
            color: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            margin: '0 auto 1.25rem'
          }}>
            ✓
          </div>
          <p style={{ color: COLORS.gold, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem' }}>
            Pago confirmado
          </p>
          <h1 style={{ color: COLORS.navy, fontSize: '2rem', marginBottom: '0.75rem' }}>
            ¡Tu orden está en proceso!
          </h1>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Stripe aceptó el pago y {BRAND.name} actualizó la orden. Ya puedes verla en tus servicios y expedientes.
          </p>
          <div style={{ background: COLORS.bg, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Orden</p>
            <p style={{ color: COLORS.navy, fontWeight: 800, wordBreak: 'break-all' }}>{paidOrder.id}</p>
            <p style={{ color: COLORS.green, fontWeight: 800, marginTop: '0.5rem' }}>Estado: {paidOrder.status || 'paid'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button 
              onClick={() => navigate('/service-orders')} 
              style={{ 
                padding: '0.9rem', 
                borderRadius: '6px', 
                border: 'none', 
                background: COLORS.navy, 
                color: 'white', 
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Ver mis órdenes
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                padding: '0.9rem', 
                borderRadius: '6px', 
                border: `1px solid ${COLORS.border}`, 
                background: 'white', 
                color: COLORS.navy, 
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Ir al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, paddingTop: '80px' }}>
      <Elements
        stripe={stripePromise}
        options={{
          mode: 'payment',
          amount: Math.round(Number(amount) * 100),
          currency: 'usd',
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: COLORS.navy,
              colorText: COLORS.text,
              borderRadius: '8px'
            }
          }
        }}
      >
        <CheckoutForm 
          orderId={orderId} 
          amount={amount} 
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </Elements>
    </div>
  );
}
