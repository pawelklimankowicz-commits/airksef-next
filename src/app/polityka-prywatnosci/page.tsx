import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Polityka prywatności</h1>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Dane logowania i profilu przetwarzane są przez dostawcę uwierzytelniania (Clerk) zgodnie z jego polityką.
        </li>
        <li>
          Zapisane faktury i pliki XML przechowywane są w bazie danych operatora aplikacji w celu świadczenia usługi.
        </li>
        <li>Płatności obsługuje Stripe — dane kart nie są przechowywane na serwerze AIRKSEF.</li>
        <li>Kontakt w sprawach RODO: przez adres podany na stronie głównej usługi.</li>
      </ul>
      <p className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Strona główna
        </Link>
      </p>
    </div>
  );
}
