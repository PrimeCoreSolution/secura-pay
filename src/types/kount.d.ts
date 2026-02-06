declare module '@kount/kount-web-client-sdk' {
  interface KountSDKConfig {
    clientID: string;
    environment: "TEST" | "PROD";
    isSinglePageApp?: boolean;
    isDebugEnabled?: boolean;
  }

  function kountSDK(config: KountSDKConfig, sessionId: string): void;
  export default kountSDK;
}

