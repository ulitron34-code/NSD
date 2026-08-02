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

vi.mock('stripe', () => ({
  default: vi.fn(function StripeMock() {
    return {
      paymentIntents: { create: createPaymentIntentMock },
      refunds: { create: createRefundMock }
    };
  })
}));

describe('stripeBillingService', () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalKey;
    createPaymentIntentMock.mockClear();
    createRefundMock.mockClear();
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
});
