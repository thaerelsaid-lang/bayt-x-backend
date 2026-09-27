import type {
  AIProvider,
  MapProvider,
  NotificationProvider,
  ParsedSearchQuery,
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  StorageProvider,
} from "./types";

// ---- Mock Payment Provider ----
// Simulates a gateway locally. Swap for a real, licensed provider (Paymob,
// Fawry, Stripe, etc.) by writing a class that implements PaymentProvider
// and pointing the factory below at it — no other file needs to change.
export class MockPaymentProvider implements PaymentProvider {
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      transactionId: `MOCK-PAY-${Date.now()}`,
      status: "pending",
    };
  }
  async getStatus(): Promise<PaymentIntentResult["status"]> {
    return "succeeded";
  }
}

// ---- Mock Map Provider ----
// Returns a deterministic fake geocode so the UI has something to render
// before a real Maps API key is configured.
export class MockMapProvider implements MapProvider {
  async geocode(address: string) {
    return {
      latitude: 30.05 + Math.random() * 0.1,
      longitude: 31.3 + Math.random() * 0.1,
      formattedAddress: address,
    };
  }
  staticMapUrl(lat: number, lng: number) {
    return `/mock-map?lat=${lat}&lng=${lng}`;
  }
}

// ---- Mock AI Provider ----
// Very small rule-based parser standing in for a real LLM call. Replace the
// body of parseSearchQuery with an OpenAI/Anthropic request once an API key
// is configured — the function signature stays the same.
export class MockAIProvider implements AIProvider {
  async parseSearchQuery(freeText: string): Promise<ParsedSearchQuery> {
    const result: ParsedSearchQuery = { notes: freeText };
    const roomsMatch = freeText.match(/(\d)\s*(أوض|غرف)/);
    if (roomsMatch) result.bedrooms = Number(roomsMatch[1]);

    const budgetMatch = freeText.match(/(\d+(\.\d+)?)\s*مليون/);
    if (budgetMatch) result.maxBudget = Number(budgetMatch[1]) * 1_000_000 * 1.15;

    const areas = ["التجمع", "مدينة نصر", "المعادي", "الشيخ زايد", "أكتوبر"];
    result.location = areas.find((a) => freeText.includes(a));

    if (/إيجار|تأجير/.test(freeText)) result.purpose = "RENT";
    else if (/شراء|أشتري/.test(freeText)) result.purpose = "SALE";

    return result;
  }

  async estimateValuation(input: {
    areaSqm: number;
    bedrooms: number;
    district: string;
    finishLevel: string;
  }) {
    // Crude placeholder formula — replace with a real model/dataset later.
    const base = input.areaSqm * 18000 + input.bedrooms * 100000;
    return { min: Math.round(base * 0.93), max: Math.round(base * 1.08) };
  }
}

// ---- Mock Storage Provider ----
export class MockStorageProvider implements StorageProvider {
  async upload(file: { name: string }) {
    return { url: `/mock-storage/${Date.now()}-${file.name}` };
  }
  async delete() {
    return;
  }
}

// ---- Mock Notification Provider ----
export class MockNotificationProvider implements NotificationProvider {
  async send(userId: string, title: string, body: string) {
    // In MVP this just writes a Notification row (see /api/notifications);
    // a real provider would also push an SMS/email/push notification here.
    console.log(`[notify:${userId}] ${title} — ${body}`);
  }
}
