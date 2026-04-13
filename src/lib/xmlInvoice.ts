import type { InvoiceInput } from "../types/invoice";

/** Escapowanie tekstu do XML (FA). */
export function escapeXml(n: string): string {
  return n
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtAmount(n: number): string {
  return n.toFixed(2);
}

/**
 * Buduje XML faktury FA (3) zgodny z namespace wzoru CRD.
 *
 * Struktura podmiotów (zgodna z KSeF dla polskiego sprzedawcy usług do zagranicznego klienta):
 *   Podmiot1 = NABYWCA (zagraniczny klient) → n.supplierVat / n.supplierName / n.supplierCountryCode
 *   Podmiot2 = SPRZEDAWCA (polska firma / freelancer) → n.buyerNip / n.buyerName / KodKraju PL
 *
 * Uwaga historyczna: pola `buyer*` przechowują dane polskiego sprzedawcy,
 * a pola `supplier*` — dane zagranicznego nabywcy (klienta). Nazewnictwo
 * odzwierciedla poprzedni model aplikacji i będzie zunifikowane w kolejnej wersji.
 */
export function buildInvoiceXml(n: InvoiceInput): string {
  const dataWytworzenia = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  let vatLines = "";
  const c = n.vatRate;
  if (c === "23%") {
    vatLines = `    <P_13_1>${fmtAmount(n.netAmount)}</P_13_1>
    <P_14_1>${fmtAmount(n.vatAmount)}</P_14_1>`;
  } else if (c === "8%") {
    vatLines = `    <P_13_2>${fmtAmount(n.netAmount)}</P_13_2>
    <P_14_2>${fmtAmount(n.vatAmount)}</P_14_2>`;
  } else if (c === "5%") {
    vatLines = `    <P_13_3>${fmtAmount(n.netAmount)}</P_13_3>
    <P_14_3>${fmtAmount(n.vatAmount)}</P_14_3>`;
  } else if (c === "0%") {
    vatLines = `    <P_13_6_1>${fmtAmount(n.netAmount)}</P_13_6_1>`;
  } else if (c === "ZW") {
    vatLines = `    <P_13_7>${fmtAmount(n.netAmount)}</P_13_7>`;
  } else if (c === "NP") {
    vatLines = `    <P_13_11>${fmtAmount(n.netAmount)}</P_13_11>`;
  }

  const rodzajKor =
    n.isCorrection ? `
    <RodzajFaktury>KOR</RodzajFaktury>` : "";

  const daneKor =
    n.isCorrection && n.originalInvoiceNumber
      ? `
    <DaneFaKorygowanej>
      <DataWystFaKorygowanej>${escapeXml(n.originalIssueDate ?? n.issueDate)}</DataWystFaKorygowanej>
      <NrFaKorygowanej>${escapeXml(n.originalInvoiceNumber)}</NrFaKorygowanej>${n.originalKsefNumber ? `
      <NrKSeF>${escapeXml(n.originalKsefNumber)}</NrKSeF>` : ""}
    </DaneFaKorygowanej>`
      : "";

  const powodKor =
    n.isCorrection && n.correctionReason
      ? `
    <P_15Z>${escapeXml(n.correctionReason)}</P_15Z>`
      : "";

  const kurs =
    n.currency !== "PLN" && n.exchangeRate != null
      ? `
    <KursWalutyZ>${n.exchangeRate.toFixed(4)}</KursWalutyZ>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Faktura xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/">
  <Naglowek>
    <KodFormularza kodSystemowy="FA (3)" wersjaSchemy="1-0E">FA</KodFormularza>
    <WariantFormularza>3</WariantFormularza>
    <DataWytworzeniaFa>${dataWytworzenia}</DataWytworzeniaFa>
    <SystemInfo>AIRKSEF v1.0</SystemInfo>
  </Naglowek>
  <Podmiot1>
    <DaneIdentyfikacyjne>
      <NIP>${escapeXml(n.supplierVat)}</NIP>
      <Nazwa>${escapeXml(n.supplierName)}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <KodKraju>${escapeXml(n.supplierCountryCode)}</KodKraju>
      <AdresL1>${escapeXml(n.supplierAddress)}</AdresL1>
    </Adres>
  </Podmiot1>
  <Podmiot2>
    <DaneIdentyfikacyjne>
      <NIP>${escapeXml(n.buyerNip)}</NIP>
      <Nazwa>${escapeXml(n.buyerName)}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <KodKraju>PL</KodKraju>
      <AdresL1>${escapeXml(n.buyerAddress)}</AdresL1>
      <AdresL2>${escapeXml(n.buyerCity)} ${escapeXml(n.buyerZip)}</AdresL2>
    </Adres>
  </Podmiot2>
  <Fa>${rodzajKor}
    <KodWaluty>${escapeXml(n.currency)}</KodWaluty>
    <P_1>${escapeXml(n.issueDate)}</P_1>
    <P_2>${escapeXml(n.invoiceNumber)}</P_2>
    <P_6>${escapeXml(n.saleDate)}</P_6>
${vatLines}
    <P_15>${fmtAmount(n.grossAmount)}</P_15>${kurs}${daneKor}${powodKor}
    <Adnotacje>
      <P_16>2</P_16>
      <P_17>2</P_17>
      <P_18>2</P_18>
      <P_18A>2</P_18A>
      <P_19>2</P_19>
      <P_22>2</P_22>
      <P_23>2</P_23>
      <P_PMarzy>2</P_PMarzy>
    </Adnotacje>
  </Fa>
</Faktura>`;
}
