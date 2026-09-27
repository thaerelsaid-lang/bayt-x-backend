// Provider abstraction layer.
//
// Nothing in the app should import a payment gateway, map SDK, LLM SDK,
// storage bucket client, or SMS/push provider directly. Everything goes
// through one of these interfaces, so swapping "mock" for a real, licensed
// provider later is a one-file change (see the provider's index.ts).

export interface PaymentIntentInput {
  userId: string;
  amount: number;
  currency: string;
  purpose: string;
}

export interface PaymentIntentResult {
  transactionId: string;
  status: "pending" | "succeeded" | "failed";
}

export interface PaymentProvider {
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  getStatus(transactionId: string): Promise<PaymentIntentResult["status"]>;
  // Never implement raw card storage here or anywhere else in the app.
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface MapProvider {
  geocode(address: string): Promise<GeocodeResult>;
  staticMapUrl(lat: number, lng: number): string;
}

export interface ParsedSearchQuery {
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  bedrooms?: number;
  propertyType?: string;
  purpose?: "SALE" | "RENT";
  notes?: string;
}

export interface AIProvider {
  parseSearchQuery(freeText: string): Promise<ParsedSearchQuery>;
  estimateValuation(input: {
    areaSqm: number;
    bedrooms: number;
    district: string;
    finishLevel: string;
  }): Promise<{ min: number; max: number }>;
}

export interface StorageProvider {
  upload(file: { name: string; buffer: Buffer; mimeType: string }): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}

export interface NotificationProvider {
  send(userId: string, title: string, body: string): Promise<void>;
}
