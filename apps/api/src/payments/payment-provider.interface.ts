export interface PaymentRequestResult {
  authority: string;
  redirectUrl: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  refId?: string;
}

export interface PaymentProvider {
  request(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<PaymentRequestResult>;
  verify(authority: string, amount: number): Promise<PaymentVerifyResult>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
