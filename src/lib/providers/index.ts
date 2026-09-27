import {
  MockAIProvider,
  MockMapProvider,
  MockNotificationProvider,
  MockPaymentProvider,
  MockStorageProvider,
} from "./mock";
import type {
  AIProvider,
  MapProvider,
  NotificationProvider,
  PaymentProvider,
  StorageProvider,
} from "./types";

// Central place that decides which implementation of each provider to use.
// Every route/service imports FROM HERE, never directly from ./mock or a
// vendor SDK. To go live with a real provider:
//   1. Write RealXProvider implementing the same interface in its own file.
//   2. Add a branch below reading the matching env var.
//   3. Set the env var in production — nothing else in the app changes.

export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    // case "paymob": return new PaymobPaymentProvider();
    default:
      return new MockPaymentProvider();
  }
}

export function getMapProvider(): MapProvider {
  switch (process.env.MAP_PROVIDER) {
    // case "google_maps": return new GoogleMapsProvider();
    default:
      return new MockMapProvider();
  }
}

export function getAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    // case "openai": return new OpenAIProvider();
    default:
      return new MockAIProvider();
  }
}

export function getStorageProvider(): StorageProvider {
  switch (process.env.STORAGE_PROVIDER) {
    // case "s3": return new S3StorageProvider();
    default:
      return new MockStorageProvider();
  }
}

export function getNotificationProvider(): NotificationProvider {
  switch (process.env.NOTIFICATION_PROVIDER) {
    // case "twilio": return new TwilioNotificationProvider();
    default:
      return new MockNotificationProvider();
  }
}
