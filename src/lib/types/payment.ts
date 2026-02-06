// Kount Session Verification Request
export interface KountSessionVerificationRequest {
  paymentId: string;
  sessionId: string; // Kount session ID from SDK
  paymentToken?: string; // Stripe payment intent ID or session ID
}

// Kount Session Verification Response
export interface KountSessionVerificationResponse {
  success: boolean;
  message?: string;
  status?: string;
  verified?: boolean;
  kountRisVerified?: boolean;
  fraudScore?: number;
  recommendation?: string;
  payment?: {
    paymentId: string;
    paymentNumber: string;
    url: string; // Stripe URL returned from backend
    amount: number;
    currency: string;
    expiresAt: string;
    status: string;
  };
}

