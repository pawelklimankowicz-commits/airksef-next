/** Opcjonalny e-mail kontaktowy (produkcja). Ustaw w hostingu: NEXT_PUBLIC_CONTACT_EMAIL */
export function publicContactEmail(): string | undefined {
  const e = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return e || undefined;
}
