/** Jasny motyw AIRKSEF — zgodny z landingiem i screenami (krem, pomarańcz #f58220). */
export const clerkAppearance = {
  layout: {
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#f58220",
    colorBackground: "#faf9f6",
    colorText: "#111827",
    colorTextSecondary: "#6b7280",
    colorInputBackground: "#f3f4f6",
    colorInputText: "#111827",
    borderRadius: "0.625rem",
  },
  elements: {
    card: "shadow-sm border border-neutral-200/90 bg-white",
    formButtonPrimary:
      "!bg-[#f58220] hover:!bg-[#e07518] !text-white !shadow-none border-none",
    footerActionLink: "text-[#f58220] hover:text-[#e07518]",
    socialButtonsBlockButton: "border-neutral-200 bg-white text-neutral-900",
    /* Bez „Kontynuuj z Apple” — zostaje Google + separator + e-mail/hasło */
    socialButtonsBlockButton__oauth_apple: "!hidden",
    socialButtonsIconButton__oauth_apple: "!hidden",
  },
};
