"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { TagInput } from "@/components/common/tag-input";
import { SvgView } from "@/components/brand/svg-view";
import { getIcon, ICONS } from "@/lib/render/icons";
import { escapeXml } from "@/lib/render/svg";
import { SITE_SOCIALS, type SiteContent, type SiteImage, type SiteSection } from "@/lib/render/site";
import type { WebsiteBrand, WebsiteMedia } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./site-images";
import { LabeledField } from "./labeled-field";

type Section<T extends SiteSection["type"]> = Extract<SiteSection, { type: T }>;

const SOCIAL_LABELS: Record<(typeof SITE_SOCIALS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
};

/** Icône de la bibliothèque en SVG, pour l'aperçu du sélecteur. */
function iconSvg(id: string) {
  const icon = getIcon(id);
  if (!icon) return "";
  const body = icon.node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(" ")}/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export interface MediaActions {
  media: WebsiteMedia[];
  upload: (dataUrl: string, alt: string) => Promise<void>;
  remove: (id: string) => void;
}

interface PanelProps {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
  brand?: WebsiteBrand;
  mediaActions: MediaActions;
  disabled: boolean;
}

/** Liste d'éléments répétés (services, avis, questions) : ajout, retrait, champs. */
function ItemList<T>({
  items,
  onChange,
  create,
  max,
  addLabel,
  disabled,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  max: number;
  addLabel: string;
  disabled: boolean;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const t = useTranslations("site.fields");
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        // L'ordre des éléments ne change pas pendant la saisie : l'index suffit comme clé.
        <div key={index} className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          {render(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))))}
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="justify-self-end text-muted-foreground"
            disabled={disabled}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 /> {t("remove")}
          </Button>
        </div>
      ))}
      {items.length < max && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...items, create()])}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  );
}

function HeroFields({ section, update, brand, mediaActions, disabled }: { section: Section<"hero">; update: (patch: Partial<Section<"hero">>) => void } & Omit<PanelProps, "content" | "onChange">) {
  const t = useTranslations("site.fields");
  return (
    <>
      <LabeledField label={t("title")}>
        <Input value={section.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} />
      </LabeledField>
      <LabeledField label={t("subtitle")}>
        <Textarea value={section.subtitle} maxLength={240} rows={2} onChange={(e) => update({ subtitle: e.target.value })} />
      </LabeledField>
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledField label={t("cta")}>
          <Input value={section.cta} maxLength={40} onChange={(e) => update({ cta: e.target.value })} />
        </LabeledField>
        <LabeledField label={t("ctaTarget")}>
          <NativeSelect value={section.ctaTarget} onChange={(e) => update({ ctaTarget: e.target.value as Section<"hero">["ctaTarget"] })}>
            {(["contact", "whatsapp", "services"] as const).map((target) => (
              <option key={target} value={target}>
                {t(`ctaTargets.${target}`)}
              </option>
            ))}
          </NativeSelect>
        </LabeledField>
      </div>
      <Field label={t("image")}>
        <ImagePicker
          assets={brand?.assets}
          media={mediaActions.media}
          value={section.image ? [section.image] : []}
          onChange={(images) => update({ image: images[0] ?? null })}
          disabled={disabled}
          onUpload={mediaActions.upload}
          onRemoveMedia={mediaActions.remove}
        />
      </Field>
    </>
  );
}

function SectionFields({ section, update, ...rest }: { section: SiteSection; update: (patch: Partial<SiteSection>) => void } & Omit<PanelProps, "content" | "onChange">) {
  const t = useTranslations("site.fields");
  const { disabled } = rest;
  const title = (
    <LabeledField label={t("title")}>
      <Input value={section.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} />
    </LabeledField>
  );
  switch (section.type) {
    case "hero":
      return <HeroFields section={section} update={update} {...rest} />;
    case "about":
      return (
        <>
          {title}
          <LabeledField label={t("text")} hint={t("textHint")}>
            <Textarea value={section.text} maxLength={3000} rows={6} onChange={(e) => update({ text: e.target.value })} />
          </LabeledField>
          <LabeledField label={t("values")} hint={t("valuesHint")}>
            <TagInput value={section.values} max={8} onChange={(values) => update({ values: values.map((v) => v.slice(0, 60)) })} />
          </LabeledField>
        </>
      );
    case "services":
      return (
        <>
          {title}
          <LabeledField label={t("intro")}>
            <Textarea value={section.intro} maxLength={400} rows={2} onChange={(e) => update({ intro: e.target.value })} />
          </LabeledField>
          <ItemList
            items={section.items}
            max={12}
            addLabel={t("addService")}
            disabled={disabled}
            create={() => ({ title: "", text: "", icon: "sparkles" })}
            onChange={(items) => update({ items })}
            render={(item, set) => (
              <>
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <LabeledField label={t("itemTitle")}>
                    <Input value={item.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} />
                  </LabeledField>
                  <LabeledField label={t("icon")}>
                    <div className="flex items-center gap-1.5">
                      <SvgView svg={iconSvg(item.icon)} className="size-8 rounded-md bg-background" />
                      <NativeSelect value={item.icon} onChange={(e) => set({ icon: e.target.value })} className="w-32">
                        {ICONS.map((icon) => (
                          <option key={icon.id} value={icon.id}>
                            {icon.id}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </LabeledField>
                </div>
                <LabeledField label={t("itemText")}>
                  <Textarea value={item.text} maxLength={400} rows={2} onChange={(e) => set({ text: e.target.value })} />
                </LabeledField>
              </>
            )}
          />
        </>
      );
    case "gallery":
      return (
        <>
          {title}
          <Field label={t("images")} hint={t("imagesHint")}>
            <ImagePicker
              multiple
              max={16}
              assets={rest.brand?.assets}
              media={rest.mediaActions.media}
              value={section.images}
              onChange={(images: SiteImage[]) => update({ images })}
              disabled={disabled}
              onUpload={rest.mediaActions.upload}
              onRemoveMedia={rest.mediaActions.remove}
            />
          </Field>
        </>
      );
    case "testimonials":
      return (
        <>
          {title}
          <ItemList
            items={section.items}
            max={12}
            addLabel={t("addTestimonial")}
            disabled={disabled}
            create={() => ({ quote: "", author: "", role: "" })}
            onChange={(items) => update({ items })}
            render={(item, set) => (
              <>
                <LabeledField label={t("quote")}>
                  <Textarea value={item.quote} maxLength={600} rows={3} onChange={(e) => set({ quote: e.target.value })} />
                </LabeledField>
                <div className="grid gap-2 sm:grid-cols-2">
                  <LabeledField label={t("author")}>
                    <Input value={item.author} maxLength={80} onChange={(e) => set({ author: e.target.value })} />
                  </LabeledField>
                  <LabeledField label={t("role")}>
                    <Input value={item.role} maxLength={80} onChange={(e) => set({ role: e.target.value })} />
                  </LabeledField>
                </div>
              </>
            )}
          />
        </>
      );
    case "faq":
      return (
        <>
          {title}
          <ItemList
            items={section.items}
            max={16}
            addLabel={t("addQuestion")}
            disabled={disabled}
            create={() => ({ question: "", answer: "" })}
            onChange={(items) => update({ items })}
            render={(item, set) => (
              <>
                <LabeledField label={t("question")}>
                  <Input value={item.question} maxLength={200} onChange={(e) => set({ question: e.target.value })} />
                </LabeledField>
                <LabeledField label={t("answer")}>
                  <Textarea value={item.answer} maxLength={1200} rows={3} onChange={(e) => set({ answer: e.target.value })} />
                </LabeledField>
              </>
            )}
          />
        </>
      );
    default:
      return (
        <>
          {title}
          <LabeledField label={t("text")}>
            <Textarea value={section.text} maxLength={400} rows={2} onChange={(e) => update({ text: e.target.value })} />
          </LabeledField>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              {t("form")}
              <span className="block text-xs text-muted-foreground">{t("formHint")}</span>
            </span>
            <Switch checked={section.form} disabled={disabled} onCheckedChange={(form) => update({ form })} />
          </label>
        </>
      );
  }
}

function SectionCard({
  section,
  index,
  count,
  open,
  onToggle,
  onChange,
  onMove,
  ...rest
}: {
  section: SiteSection;
  index: number;
  count: number;
  open: boolean;
  onToggle: () => void;
  onChange: (section: SiteSection) => void;
  onMove: (delta: -1 | 1) => void;
} & Omit<PanelProps, "content" | "onChange">) {
  const t = useTranslations("site.sections");
  const { disabled } = rest;
  // L'accueil reste en tête : les autres sections se déplacent sous lui.
  const movable = section.type !== "hero";
  return (
    <div className={cn("rounded-xl border bg-card", !section.visible && "opacity-70")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium">
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
          <span className="truncate">{t(section.type)}</span>
          {!section.visible && <span className="text-xs font-normal text-muted-foreground">· {t("hidden")}</span>}
        </button>
        {movable && (
          <>
            <Button type="button" size="icon-xs" variant="ghost" aria-label={t("moveUp")} title={t("moveUp")} disabled={disabled || index <= 1} onClick={() => onMove(-1)}>
              <ArrowUp />
            </Button>
            <Button type="button" size="icon-xs" variant="ghost" aria-label={t("moveDown")} title={t("moveDown")} disabled={disabled || index >= count - 1} onClick={() => onMove(1)}>
              <ArrowDown />
            </Button>
          </>
        )}
        <Switch
          size="sm"
          checked={section.visible}
          disabled={disabled}
          aria-label={t("visible")}
          onCheckedChange={(visible) => onChange({ ...section, visible })}
        />
      </div>
      {open && (
        <div className="grid gap-3 border-t px-3 py-3">
          <SectionFields section={section} update={(patch) => onChange({ ...section, ...patch } as SiteSection)} {...rest} />
        </div>
      )}
    </div>
  );
}

/** Onglet « Contenu » : sections du site, coordonnées, réseaux sociaux, référencement. */
export function SiteContentPanel({
  content,
  onChange,
  open,
  onOpen,
  ...rest
}: PanelProps & { open: SiteSection["type"] | null; onOpen: (type: SiteSection["type"] | null) => void }) {
  const t = useTranslations("site");
  const { disabled } = rest;
  const set = (patch: Partial<SiteContent>) => onChange({ ...content, ...patch });
  const setContact = (patch: Partial<SiteContent["contact"]>) => set({ contact: { ...content.contact, ...patch } });

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 1 || target >= content.sections.length) return;
    const sections = [...content.sections];
    [sections[index], sections[target]] = [sections[target]!, sections[index]!];
    set({ sections });
  };

  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-4">
      <div className="grid gap-2">
        {content.sections.map((section, index) => (
          <SectionCard
            key={section.type}
            section={section}
            index={index}
            count={content.sections.length}
            open={open === section.type}
            onToggle={() => onOpen(open === section.type ? null : section.type)}
            onChange={(next) => set({ sections: content.sections.map((s, i) => (i === index ? next : s)) })}
            onMove={(delta) => move(index, delta)}
            {...rest}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("contact.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={t("contact.phone")}>
              <Input value={content.contact.phone} maxLength={40} inputMode="tel" onChange={(e) => setContact({ phone: e.target.value })} />
            </LabeledField>
            <LabeledField label={t("contact.whatsapp")} hint={t("contact.whatsappHint")}>
              <Input value={content.contact.whatsapp} maxLength={40} inputMode="tel" onChange={(e) => setContact({ whatsapp: e.target.value })} />
            </LabeledField>
          </div>
          <LabeledField label={t("contact.email")}>
            <Input type="email" value={content.contact.email} maxLength={200} onChange={(e) => setContact({ email: e.target.value })} />
          </LabeledField>
          <LabeledField label={t("contact.address")}>
            <Input value={content.contact.address} maxLength={300} onChange={(e) => setContact({ address: e.target.value })} />
          </LabeledField>
          <LabeledField label={t("contact.hours")}>
            <Textarea
              value={content.contact.hours}
              maxLength={300}
              rows={2}
              placeholder={t("contact.hoursPlaceholder")}
              onChange={(e) => setContact({ hours: e.target.value })}
            />
          </LabeledField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("social.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {SITE_SOCIALS.map((network) => (
            <LabeledField key={network} label={SOCIAL_LABELS[network]}>
              <Input
                value={content.social[network] ?? ""}
                maxLength={300}
                placeholder={t("social.placeholder")}
                onChange={(e) => set({ social: { ...content.social, [network]: e.target.value } })}
              />
            </LabeledField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("seo.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <LabeledField label={t("seo.pageTitle")} hint={t("seo.pageTitleHint")}>
            <Input value={content.seo.title} maxLength={120} onChange={(e) => set({ seo: { ...content.seo, title: e.target.value } })} />
          </LabeledField>
          <LabeledField label={t("seo.pageDescription")} hint={t("seo.pageDescriptionHint")}>
            <Textarea
              value={content.seo.description}
              maxLength={300}
              rows={3}
              onChange={(e) => set({ seo: { ...content.seo, description: e.target.value } })}
            />
          </LabeledField>
        </CardContent>
      </Card>
    </fieldset>
  );
}
