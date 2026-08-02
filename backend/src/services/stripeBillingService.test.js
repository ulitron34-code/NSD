import { afterEach, describe, expect, it, vi } from 'vitest';

const createPaymentIntentMock = vi.fn(async (params, options) => ({
  id: 'pi_test_123',
  client_secret: 'pi_test_123_secret',
  amount: params.amount,
  currency: params.currency,
  metadata: params.metadata,
  idempotencyKeyUsed: options?.idempotencyKey
}));

const createRefundMock = vi.fn(async (params) => ({
  id: 're_test_123',
  payment_intent: params.payment_intent,
  status: 'succeeded'
}));

const createCustomerMock = vi.fn(async (params) => ({
  id: 'cus_test_123',
  email: params.email,
  metadata: params.metadata
}));

const createCheckoutSessionMock = vi.fn(async (params) => ({
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/c/pay/cs_test_123',
  customer: params.customer,
  metadata: params.metadata
}));

vi.mock('stripe', () => ({
  default: vi.fn(function StripeMock() {
    return {
      paymentIntents: { create: createPaymentIntentMock },
      refunds: { create: createRefundMock },
      customers: { create: createCustomerMock },
      checkout: { sessions: { create: createCheckoutSessionMock } }
    };
  })
}));

describe('stripeBillingService', () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalKey;
    createPaymentIntentMock.mockClear();
    createRefundMock.mockClear();
    createCustomerMock.mockClear();
    createCheckoutSessionMock.mockClear();
  });

  it('throws without creating anything when purchaseId is missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    await expect(
      createPackagePurchaseIntent({ amountCents: 1000, currency: 'USD', userId: 'user-1', offerCode: 'applicant_essential' })
    ).rejects.toThrow(/purchaseId es requerido/);
  });

  it('throws on a non-positive amount instead of trusting the caller', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    await expect(
      createPackagePurchaseIntent({ purchaseId: 'purchase-1', amountCents: 0, currency: 'USD' })
    ).rejects.toThrow(/monto positivo/);
  });

  it('throws when STRIPE_SECRET_KEY is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    await expect(
      createPackagePurchaseIntent({ purchaseId: 'purchase-1', amountCents: 49500, currency: 'USD' })
    ).rejects.toThrow(/STRIPE_SECRET_KEY/);
  });

  it('creates a PaymentIntent with a purchase-scoped idempotency key and package metadata', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    const paymentIntent = await createPackagePurchaseIntent({
      purchaseId: 'purchase-1',
      amountCents: 49500,
      currency: 'USD',
      userId: 'user-1',
      offerCode: 'applicant_essential'
    });

    expect(paymentIntent.id).toBe('pi_test_123');
    expect(createPaymentIntentMock).toHaveBeenCalledTimes(1);
    const [params, options] = createPaymentIntentMock.mock.calls[0];
    expect(params.amount).toBe(49500);
    expect(params.currency).toBe('usd');
    expect(params.metadata).toEqual({
      type: 'package_purchase',
      purchaseId: 'purchase-1',
      userId: 'user-1',
      offerCode: 'applicant_essential'
    });
    expect(options.idempotencyKey).toBe('package_purchase_purchase-1');
  });

  it('includes targetPurchaseId in metadata for an addon PaymentIntent', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    await createPackagePurchaseIntent({
      purchaseId: 'addon-1',
      amountCents: 27500,
      currency: 'USD',
      userId: 'user-1',
      offerCode: 'addon_ua_5',
      targetPurchaseId: 'base-purchase-1'
    });

    const [params] = createPaymentIntentMock.mock.calls[0];
    expect(params.metadata.targetPurchaseId).toBe('base-purchase-1');
  });

  it('omits targetPurchaseId from metadata when not an addon', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.resetModules();
    const { createPackagePurchaseIntent } = await import('./stripeBillingService.js');

    await createPackagePurchaseIntent({
      purchaseId: 'purchase-1',
      amountCents: 49500,
      currency: 'USD',
      userId: 'user-1',
      offerCode: 'applicant_essential'
    });

    const [params] = createPaymentIntentMock.mock.calls[0];
    expect(params.metadata).not.toHaveProperty('targetPurchaseId');
  });

  describe('refundPackagePurchase', () => {
    it('throws when paymentIntentId is missing', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { refundPackagePurchase } = await import('./stripeBillingService.js');

      await expect(refundPackagePurchase()).rejects.toThrow(/paymentIntentId es requerido/);
    });

    it('creates a Stripe refund for the given PaymentIntent', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { refundPackagePurchase } = await import('./stripeBillingService.js');

      const refund = await refundPackagePurchase('pi_test_123');

      expect(refund.id).toBe('re_test_123');
      expect(createRefundMock).toHaveBeenCalledWith({ payment_intent: 'pi_test_123' });
    });
  });

  describe('createStripeCustomer', () => {
    it('throws when billingAccountId is missing', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { createStripeCustomer } = await import('./stripeBillingService.js');

      await expect(createStripeCustomer({ email: 'a@b.com' })).rejects.toThrow(/billingAccountId es requerido/);
    });

    it('creates a Stripe customer tagged with the billing account id', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { createStripeCustomer } = await import('./stripeBillingService.js');

      const customer = await createStripeCustomer({ email: 'a@b.com', billingAccountId: 'acct-1' });
      expect(customer.id).toBe('cus_test_123');
      expect(createCustomerMock).toHaveBeenCalledWith({ email: 'a@b.com', metadata: { billingAccountId: 'acct-1' } });
    });
  });

  describe('createGrantorCheckoutSession', () => {
    it('requires customerId, priceId, successUrl and cancelUrl', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { createGrantorCheckoutSession } = await import('./stripeBillingService.js');

      await expect(createGrantorCheckoutSession({})).rejects.toThrow(/customerId es requerido/);
      await expect(createGrantorCheckoutSession({ customerId: 'cus_1' })).rejects.toThrow(/priceId es requerido/);
      await expect(
        createGrantorCheckoutSession({ customerId: 'cus_1', priceId: 'price_1' })
      ).rejects.toThrow(/successUrl y cancelUrl/);
    });

    it('creates a subscription-mode Checkout Session with metadata on both the session and the subscription', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      vi.resetModules();
      const { createGrantorCheckoutSession } = await import('./stripeBillingService.js');

      const session = await createGrantorCheckoutSession({
        customerId: 'cus_1',
        priceId: 'price_1',
        billingAccountId: 'acct-1',
        offerId: 'offer-1',
        offerCode: 'grantor_professional',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });

      expect(session.id).toBe('cs_test_123');
      const [params] = createCheckoutSessionMock.mock.calls[0];
      expect(params.mode).toBe('subscription');
      expect(params.customer).toBe('cus_1');
      expect(params.line_items).toEqual([{ price: 'price_1', quantity: 1 }]);
      expect(params.metadata).toEqual({
        type: 'grantor_subscription',
        billingAccountId: 'acct-1',
        offerId: 'offer-1',
        offerCode: 'grantor_professional'
      });
      expect(params.subscription_data.metadata).toEqual(params.metadata);
      expect(params.success_url).toBe('https://example.com/success');
      expect(params.cancel_url).toBe('https://example.com/cancel');
    });
  });
});
