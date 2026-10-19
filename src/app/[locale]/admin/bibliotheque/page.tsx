"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EMAIL_TEMPLATES } from "@/lib/render/email-signature";
import { cssFontFamily, FONTS } from "@/lib/render/fonts";
import { ICONS } from "@/lib/render/icons";

export default function AdminLibraryPage() {
  const t = useTranslations("admin.library");
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("fonts")} ({FONTS.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Police</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>{t("license")}</TableHead>
                <TableHead>{t("active")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FONTS.map((font) => (
                <TableRow key={font.id}>
                  <TableCell className="text-lg" style={{ fontFamily: cssFontFamily(font.id) }}>
                    {font.name}
                  </TableCell>
                  <TableCell>{font.category}</TableCell>
                  <TableCell>{font.license}</TableCell>
                  <TableCell>✓</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("icons")} ({ICONS.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {ICONS.map((icon) => (
            <div key={icon.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
              <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {icon.node.map(([tag, attrs], i) => {
                  const Tag = tag as "path";
                  return <Tag key={i} {...(attrs as Record<string, string>)} />;
                })}
              </svg>
              <span className="min-w-0">
                <span className="block truncate font-medium">{icon.id}</span>
                <Badge variant="outline" className="mt-0.5">
                  {icon.license}
                </Badge>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("templates")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {EMAIL_TEMPLATES.map((tpl) => (
            <Badge key={tpl.id} variant="secondary">
              {tpl.name}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
