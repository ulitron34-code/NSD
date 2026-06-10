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

function CheckoutForm({ orderId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpressReady, setIsExpressReady] = useState(false);
  const [error, setError] = useState(null);
  const completeOrder = async (paymentIntent) => {
    const confirmation = await paymentsAPI.confirmPayment(orderId, paymentIntent.id);
    onSuccess(confirmation.data?.order || null);
  };

  const handleExpressConfirm = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { data } = await paymentsAPI.createPaymentIntent(orderId);
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        redirect: 'if_required'
      });

      if (result.error) {
        setError(result.error.message || 'No se pudo completar el pago rapido');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await completeOrder(result.paymentIntent);
      } else {
        setError('Pago rapido no completado');
      }
    } catch (err) {
      setError(err.message);
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
      // 1. Crear payment intent
      const { data } = await paymentsAPI.createPaymentIntent(orderId);

      // 2. Confirmar pago
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)
        }
      });

      if (result.error) {
        setError(result.error.message || 'No se pudo completar el pago');
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        await completeOrder(result.paymentIntent);
      } else {
        setError('Pago no completado');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
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
          Ingresa los datos de tarjeta de prueba. El pago se procesa con Stripe y despues se confirma la orden en NSD.
        </p>

        <div style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '10px',
          padding: '1rem',
          background: '#fff',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
            <div>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: '0.2rem' }}>Pago rapido</p>
              <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', lineHeight: 1.45 }}>
                Google Pay o PayPal apareceran si estan habilitados en Stripe y disponibles en este navegador.
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
              Si no aparece un boton, usa tarjeta por ahora. En produccion se activa desde el panel de Stripe.
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
          <StripeInput label="Numero de tarjeta">
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
        
        {error && <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          style={{
            width: '100%',
            padding: '1rem',
            marginTop: '1rem',
            background: COLORS.gold,
            color: COLORS.navy,
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          {isProcessing ? 'Procesando pago...' : 'Pagar y confirmar orden'}
        </button>
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
      } catch (error) {
        setOrderError(error.response?.data?.error || 'No se pudo cargar la orden');
      } finally {
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (!orderId) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Orden inválida</div>;
  }

  if (orderLoading) {
    return <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>Cargando checkout...</div>;
  }

  if (!amount) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Orden inválida</div>;
  }

  if (orderError) {
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
          <button onClick={() => navigate('/service-orders')} style={{ padding: '0.9rem 1.2rem', borderRadius: '6px', border: 'none', background: COLORS.navy, color: 'white', fontWeight: 800 }}>
            Volver a mis ordenes
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
            Falta configurar VITE_STRIPE_PUBLIC_KEY en el entorno de Netlify.
          </p>
          <button onClick={() => navigate('/service-orders')} style={{ padding: '0.9rem 1.2rem', borderRadius: '6px', border: 'none', background: COLORS.navy, color: 'white', fontWeight: 800 }}>
            Volver a mis ordenes
          </button>
        </div>
      </div>
    );
  }

  const handleSuccess = (order) => {
    setPaidOrder(order || { id: orderId, status: 'paid', amount });
  };

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
            background: COLORS.greenBg,
            color: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            margin: '0 auto 1.25rem'
          }}>
            OK
          </div>
          <p style={{ color: COLORS.gold, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem' }}>
            Pago confirmado
          </p>
          <h1 style={{ color: COLORS.navy, fontSize: '2rem', marginBottom: '0.75rem' }}>
            Tu orden ya esta en proceso
          </h1>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Stripe acepto el pago y NSD actualizo la orden. Ya puedes verla en tus servicios y expedientes.
          </p>
          <div style={{ background: COLORS.bg, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <p style={{ color: COLORS.textMuted, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Orden</p>
            <p style={{ color: COLORS.navy, fontWeight: 800, wordBreak: 'break-all' }}>{paidOrder.id}</p>
            <p style={{ color: COLORS.green, fontWeight: 800, marginTop: '0.5rem' }}>Estado: {paidOrder.status || 'paid'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => navigate('/service-orders')} style={{ padding: '0.9rem', borderRadius: '6px', border: 'none', background: COLORS.navy, color: 'white', fontWeight: 800 }}>
              Ver mis ordenes
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '0.9rem', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: 'white', color: COLORS.navy, fontWeight: 800 }}>
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
        <CheckoutForm orderId={orderId} amount={amount} onSuccess={handleSuccess} />
      </Elements>
    </div>
  );
}
