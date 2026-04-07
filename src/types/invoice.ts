export type VatRate = "23%" | "8%" | "5%" | "0%" | "ZW" | "NP";

export interface InvoiceInput {
  buyerNip: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerZip: string;
  supplierName: string;
  supplierVat: string;
  supplierAddress: string;
  supplierCountryCode: string;
  currency: string;
  issueDate: string;
  saleDate: string;
  invoiceNumber: string;
  grossAmount: number;
  netAmount: number;
  vatAmount: number;
  vatRate: VatRate;
  exchangeRate?: number;
  isCorrection?: boolean;
  originalInvoiceNumber?: string;
  originalKsefNumber?: string;
  correctionReason?: string;
}

export interface SavedInvoice extends InvoiceInput {
  id: string;
  createdAt: string;
  label: string;
}
