import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { KountSessionVerificationResponse } from "@/lib/types/payment";

interface PaymentFormProps {
  paymentId: string;
  sessionId: string;
  amount: string; // Amount in dollars (e.g., "10.99")
  description?: string;
  successUrl?: string;
  errorUrl?: string;
}

export function PaymentForm({
  paymentId,
  sessionId,
  amount,
  description,
  successUrl,
  errorUrl,
}: PaymentFormProps) {
  const [paymentStatus, setPaymentStatus] = useState<true | string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);

  // Format amount for display
  const formattedAmount = useMemo(() => {
    const amountNum = parseFloat(amount || "0");
    return amountNum.toFixed(2);
  }, [amount]);

  const handlePayment = async () => {
    // Prevent duplicate submissions
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      // Send paymentId, sessionId to backend for Kount verification
      // Backend will verify Kount session and return Stripe URL
      const response = await apiClient.post<KountSessionVerificationResponse>(
        "/payments/verify-kount-session",
        {
          paymentId,
          sessionId,
        }
      );

      // Process the response
      if (response && typeof response === "object") {
        // Handle wrapped response
        const data = response as { success?: boolean; error?: string; payment?: { url: string } };
        
        if (data.success && data.payment?.url) {
          // Backend returned a Stripe URL - redirect to it
          setStripeUrl(data.payment.url);
          setPaymentStatus(true);
          
          // Redirect to Stripe URL
          window.location.href = data.payment.url;
          return;
        } else if (data.success) {
          // Success but no URL (shouldn't happen, but handle gracefully)
          setPaymentStatus(true);
          if (successUrl) {
            setTimeout(() => {
              window.location.href = successUrl;
            }, 2000);
          }
          return;
        } else {
          const errorMessage = data.error || "Payment verification failed";
          setPaymentStatus(errorMessage);
          // Redirect to error URL after showing error
          if (errorUrl) {
            setTimeout(() => {
              window.location.href = errorUrl;
            }, 2000);
          }
          return;
        }
      } else {
        // Handle direct success response (unlikely but possible)
        setPaymentStatus(true);
        if (successUrl) {
          setTimeout(() => {
            window.location.href = successUrl;
          }, 1500);
        }
        return;
      }
    } catch (err) {
      // Handle errors
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "An error occurred while processing your payment";
      setPaymentStatus(errorMessage);
      // Redirect to error URL after showing error
      if (errorUrl) {
        setTimeout(() => {
          window.location.href = errorUrl;
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full max-w-2xl mx-auto border border-border bg-card/98 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-foreground mb-2">
            Complete Payment
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Review your payment details and proceed to checkout
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-6">
          {/* Amount Display (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="text"
              value={`$${formattedAmount}`}
              disabled
              className="w-full bg-muted"
              readOnly
            />
          </div>

          {/* Description Display (if provided) */}
          {description && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="p-3 rounded-md border bg-muted text-sm text-muted-foreground">
                {description}
              </div>
            </div>
          )}

          {/* Status message display */}
          {paymentStatus !== null && (
            <Alert
              className={
                paymentStatus === true
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-red-500 bg-red-50 dark:bg-red-950/20"
              }
            >
              <div className="flex items-center gap-2">
                {paymentStatus === true ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <AlertDescription
                  className={
                    paymentStatus === true
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }
                >
                  {paymentStatus === true
                    ? stripeUrl
                      ? "Redirecting to secure payment page..."
                      : "Payment verified! Redirecting..."
                    : typeof paymentStatus === "string"
                    ? paymentStatus
                    : "Payment failed"}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing payment...</span>
            </div>
          )}

          {/* Payment Button */}
          <div className="pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${formattedAmount}`
              )}
            </Button>
          </div>

          {/* Security notice */}
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Secure Payment:</strong> Your payment will be processed securely through Stripe. 
              All card information is encrypted and never stored on our servers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

