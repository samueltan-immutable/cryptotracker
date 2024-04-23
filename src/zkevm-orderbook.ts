import { checkoutSdk, config } from '@imtbl/sdk';

// Create a new Immutable SDK configuration
const baseConfig = {
  environment: config.Environment.SANDBOX,
  publishableKey: 'pk_imapik-L--e-1rok@51IIf@FZVK',
};

// Instantiate the Checkout SDKs with the default configurations
const checkout = new checkoutSdk.Checkout({
  baseConfig,
  isBridgeEnabled: true,
  // ... other configurations
});