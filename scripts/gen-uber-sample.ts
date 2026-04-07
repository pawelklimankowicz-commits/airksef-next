/**
 * Generuje przykładowy plik XML FA(3) — sprzedawca: Uber B.V. (dane z bazy platform).
 * Uruchom: npx tsx scripts/gen-uber-sample.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { splitGross } from "../src/lib/vatMath";
import { buildInvoiceXml } from "../src/lib/xmlInvoice";

const uber = {
  supplierName: "Uber B.V.",
  supplierVat: "NL852071839B01",
  supplierAddress: "Mr. Treublaan 7, 1097 DP Amsterdam",
  supplierCountryCode: "NL",
} as const;

const gross = 127.43;
const vatRate = "23%" as const;
const { net, vat } = splitGross(gross, vatRate);
const today = new Date().toISOString().slice(0, 10);

const invoice = {
  buyerNip: "5260250994",
  buyerName: "Jan Kowalski — faktura testowa AIRKSEF",
  buyerAddress: "ul. Przykładowa 12",
  buyerCity: "Warszawa",
  buyerZip: "00-001",
  supplierName: uber.supplierName,
  supplierVat: uber.supplierVat,
  supplierAddress: uber.supplierAddress,
  supplierCountryCode: uber.supplierCountryCode,
  currency: "EUR",
  issueDate: today,
  saleDate: today,
  invoiceNumber: `UBER-TEST/${today.replace(/-/g, "")}/001`,
  grossAmount: gross,
  netAmount: net,
  vatAmount: vat,
  vatRate,
  exchangeRate: 4.325,
};

const xml = buildInvoiceXml(invoice);
const out = resolve(process.cwd(), "public/sample-uber-fa.xml");
writeFileSync(out, xml, "utf8");
console.log(`Zapisano: ${out}`);
console.log("To jest fikcyjna faktura testowa do KSeF (XML), nie prawdziwy PDF z Ubera.");
