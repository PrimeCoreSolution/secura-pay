import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Cog, CheckCircle2 } from "lucide-react";
import { kountSDK } from "@/lib/kount-sdk";
import { PaymentForm } from "@/components/PaymentForm";
import { toast } from "sonner";

// Verification stages with professional messages
const verificationStages = [
  "Initializing security protocols...",
  "Running fraud check on profile...",
  "Confirming user activities...",
  "Collecting risk information...",
  "Analyzing transaction patterns...",
  "Validating device fingerprint...",
  "Cross-referencing security databases...",
  "Finalizing verification process...",
];

const KYC = () => {
  const [searchParams] = useSearchParams();
  const [kountSessionId, setKountSessionId] = useState<string | null>(null);
  const [kountInitialized, setKountInitialized] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get query parameters
  const errorUrl = searchParams.get("errorUrl") || "";
  const successUrl = searchParams.get("successUrl") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const amount = searchParams.get("amount") || "";
  const description = searchParams.get("description") || "";

  // Initialize Kount SDK
  useEffect(() => {
    if (!paymentId) return;

    const initializeKount = async () => {
      try {
        // Generate session ID with paymentId as identifier
        const sessionId = kountSDK.generateSessionId(paymentId, "KYC");
        await kountSDK.initialize(sessionId);
        setKountSessionId(sessionId);
        setKountInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Kount SDK:", error);
        // If Kount fails, still try to submit (server can handle missing session)
        // Generate a fallback session ID so the form can still render
        const fallbackSessionId = kountSDK.generateSessionId(paymentId, "KYC");
        setKountSessionId(fallbackSessionId);
        setKountInitialized(true);
        toast.error("Failed to run KYC verification, but payment form will still be available");
      }
    };

    initializeKount();
  }, [paymentId]);

  // After Kount is initialized, wait a bit then show payment form
  useEffect(() => {
    if (kountInitialized && kountSessionId && paymentId) {
      
      setIsVerifying(true);
      // Animate through stages for a few seconds, then show payment form
      const timer = setTimeout(() => {
        setIsVerifying(false);
        // Payment form will be shown when isVerifying becomes false
      }, 3000); // Show verification animation for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [kountInitialized, kountSessionId, paymentId]);

  // Animate through verification stages
  useEffect(() => {
    if (!isVerifying) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        // Cycle through stages, but don't go beyond the last one
        if (prev < verificationStages.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last stage
      });
    }, 2000); // Change stage every 2 seconds

    return () => clearInterval(interval);
  }, [isVerifying]);

  // Validate required parameters
  if (!paymentId || !amount) {
    return (
      <div className="auth-container flex items-center justify-center p-4 min-h-screen">
        <Card className="w-full max-w-md border border-border bg-card/98 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-lg font-semibold text-destructive mb-1">
              Invalid Link
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              This link is missing required parameters (paymentId, amount). Please use the link provided by the system.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show payment form after Kount is initialized and verification animation completes
  const showPaymentForm = kountInitialized && kountSessionId && !isVerifying;
  
  // Show payment form
  if (showPaymentForm) {
    return (
      <div className="auth-container flex items-center justify-center p-4 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <PaymentForm
          paymentId={paymentId}
          sessionId={kountSessionId}
          amount={amount}
          description={description}
          successUrl={successUrl}
          errorUrl={errorUrl}
        />
      </div>
    );
  }

  // Show verification screen
  return (
    <div className="auth-container flex items-center justify-center p-4 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-lg border border-border bg-card/98 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 relative">
            {/* Spinning gear */}
            <Cog
              className={`h-12 w-12 text-primary transition-all duration-300 ${
                !isVerifying ? "opacity-0 scale-0" : "animate-spin"
              }`}
            />
          </div>

          <CardTitle className="text-2xl font-bold text-foreground mb-2">
            Security Verification
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Please wait while we verify your session
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* Verification stages list */}
          <div className="space-y-4">
              {verificationStages.map((stage, index) => {
                const isActive = index === currentStage && isVerifying;
                const isCompleted = index < currentStage;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      isActive
                        ? "opacity-100 scale-100"
                        : isCompleted
                        ? "opacity-60 scale-95"
                        : "opacity-40 scale-95"
                    }`}
                  >
                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        </div>
                      ) : isActive ? (
                        <div className="flex h-5 w-5 items-center justify-center">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>

                    {/* Stage text */}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium transition-colors duration-300 ${
                          isActive
                            ? "text-foreground"
                            : isCompleted
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {stage}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          {/* Progress bar */}
          <div className="mt-6">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${((currentStage + 1) / verificationStages.length) * 100}%`,
                  }}
                />
              </div>
              {isVerifying && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Step {currentStage + 1} of {verificationStages.length}
                </p>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYC;

