// Kount SDK integration utility using npm package
import kountSDKPackage from "@kount/kount-web-client-sdk";
interface KountSDKConfig {
  clientID: string;
  environment: "TEST" | "PROD";
  isSinglePageApp?: boolean;
  isDebugEnabled?: boolean;
}

class KountSDKWrapper {
  private initialized = false;
  private sessionId: string | null = null;
  private config: KountSDKConfig | null = null;

  /**
   * Get Kount configuration from environment variables
   */
  private getConfig(): KountSDKConfig {
    // Get client ID from environment variable or use a default
    // You should set VITE_KOUNT_CLIENT_ID in your .env file
    const clientID = import.meta.env.VITE_KOUNT_CLIENT_ID || "";

    if (!clientID) {
      console.warn(
        "Kount Client ID not configured. Set VITE_KOUNT_CLIENT_ID environment variable."
      );
    }

    // Determine environment based on Vite mode
    const environment = import.meta.env.MODE === "production" ? "PROD" : "TEST";

    // Enable debug mode in development
    const isDebugEnabled = import.meta.env.MODE !== "production";

    return {
      clientID,
      environment,
      isSinglePageApp: true, // This is a React SPA
      isDebugEnabled,
    };
  }

  /**
   * Initialize Kount collection with a session ID
   */
  async initialize(sessionId: string): Promise<void> {
    if (this.initialized && this.sessionId === sessionId) {
      console.log("Kount SDK already initialized with this session");
      return;
    }

    try {
      // Get or create config
      if (!this.config) {
        this.config = this.getConfig();
      }

      // Validate client ID is configured
      if (!this.config.clientID) {
        throw new Error(
          "Kount Client ID is not configured. Please set VITE_KOUNT_CLIENT_ID environment variable."
        );
      }

      // Initialize the SDK with config and session ID
      kountSDKPackage(this.config, sessionId);

      this.sessionId = sessionId;
      this.initialized = true;
      console.log("Kount collection started with session:", sessionId);
    } catch (error) {
      console.error("Error initializing Kount SDK:", error);
      throw error;
    }
  }

  /**
   * Generate a session ID (can be overridden with custom logic)
   * Session ID must be up to 32 alphanumeric characters, dashes, or underscores
   *
   * @param identifier - Optional identifier (e.g., paymentId) to include in the session ID
   * @param prefix - Optional prefix (default: "KYC")
   */
  generateSessionId(identifier?: string, prefix: string = "KYC"): string {
    if (!identifier) {
      // If no identifier, generate a simple session ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `${prefix}_${timestamp}_${random}`.substring(0, 32);
    }

    // Use Web Crypto API for browser-compatible hashing
    // Create a simple hash function that works in the browser
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to base36 and take first 25 chars to ensure total length <= 32
    const idHash = Math.abs(hash).toString(36).substring(0, 25);
    const sessionId = `${prefix}_${idHash}`;

    // Ensure total length is <= 32 characters (Kount requirement)
    return sessionId.substring(0, 32);
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Reset initialization state (useful for testing or re-initialization)
   */
  reset(): void {
    this.initialized = false;
    this.sessionId = null;
  }

  /**
   * Update configuration (useful for dynamic config changes)
   */
  updateConfig(config: Partial<KountSDKConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
    } else {
      this.config = { ...this.getConfig(), ...config };
    }
  }
}

// Export singleton instance
export const kountSDK = new KountSDKWrapper();

// Export class for custom instances if needed
export { KountSDKWrapper as KountSDK };

