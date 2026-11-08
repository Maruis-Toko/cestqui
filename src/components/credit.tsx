import { SITE } from "@/lib/site";

export function Credit() {
  const href = `https://wa.me/${SITE.whatsapp.number}?text=${encodeURIComponent(
    SITE.whatsapp.message,
  )}`;

  return (
    <p className="py-1 text-center text-sm text-muted">
      Développé par <span className="font-semibold">{SITE.author.name}</span>
      {" · "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-accent underline-offset-4 hover:underline"
      >
        <span aria-hidden="true">💬</span> Clique pour WhatsApp
        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
      </a>
    </p>
  );
}
