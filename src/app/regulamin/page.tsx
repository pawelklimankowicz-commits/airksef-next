import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Regulamin</h1>
      <p className="mt-4 text-muted-foreground">
        AIRKSEF świadczy usługę generowania plików XML w formacie FA (3) na podstawie danych wprowadzonych przez
        użytkownika. Użytkownik ponosi odpowiedzialność za poprawność danych i zgodność z obowiązującymi przepisami
        oraz aktualnym schematem KSeF.
      </p>
      <p className="mt-4 text-muted-foreground">
        Usługa nie stanowi porady prawnej ani księgowej. Przed wysyłką dokumentów do urzędu należy zweryfikować je z
        księgowym.
      </p>
      <p className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Strona główna
        </Link>
      </p>
    </div>
  );
}
