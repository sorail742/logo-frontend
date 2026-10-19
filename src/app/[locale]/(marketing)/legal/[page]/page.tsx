import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Contenus provisoires : CGU, cession de droits et politique de confidentialité
// doivent être relues par un juriste avant le lancement (§14.2).
const PAGES = {
  cgu: {
    title: "Conditions générales d'utilisation",
    sections: [
      ["Objet", "La plateforme permet de générer un nom, un logo, des signatures et un kit de marque."],
      [
        "Propriété des logos",
        "À l'achat, les droits d'usage commercial du logo sont cédés à l'utilisateur, dans la limite des licences des polices et icônes utilisées (voir LICENCES.txt dans chaque export). Un logo acheté devient exclusif.",
      ],
      [
        "Signatures et cachets",
        "Paraphes et cachets sont des images et n'ont pas la valeur d'une signature électronique qualifiée. L'utilisateur certifie être habilité à représenter la structure.",
      ],
      ["Crédits et remboursements", "Une génération échouée est remboursée automatiquement en crédits."],
      ["Dépôt de marque", "La plateforme ne réalise qu'une pré-vérification ; un dépôt auprès de l'OAPI est recommandé."],
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    sections: [
      [
        "Cadre légal",
        "Loi guinéenne L/2016/037/AN relative à la cybersécurité et à la protection des données à caractère personnel ; RGPD pour les utilisateurs situés dans l'Union européenne.",
      ],
      ["Vos droits", "Accès, rectification, suppression et export depuis votre profil."],
      ["Conservation", "Comptes supprimés purgés après 30 jours ; factures conservées selon l'obligation comptable ; journaux techniques 90 jours."],
      ["IA", "Les briefs ne sont jamais utilisés pour entraîner des modèles ; les fournisseurs IA sont choisis avec une option de non-rétention."],
    ],
  },
} as const;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Object.keys(PAGES).map((page) => ({ locale, page })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[page]">): Promise<Metadata> {
  const { page } = await params;
  return { title: PAGES[page as keyof typeof PAGES]?.title };
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[page]">) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const content = PAGES[page as keyof typeof PAGES];
  if (!content) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-sm text-amber-700">Document provisoire, en attente de relecture juridique.</p>
      {content.sections.map(([title, body]) => (
        <section key={title} className="mt-8">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{body}</p>
        </section>
      ))}
    </article>
  );
}
