import type { Plan } from "./types";

// Offres (§8.2). Les prix en GNF sont PROVISOIRES : ils seront fixés après mesure
// du coût réel des appels IA (§15.4). L'API reste la source de vérité (GET /plans).
export const PLANS: Plan[] = [
  {
    code: "FREE",
    name: "Gratuit",
    priceGnf: 0,
    interval: null,
    monthlyCredits: 0,
    includedCredits: 0,
    maxMembers: 1,
    features: ["free.names", "free.logos", "free.png", "free.email"],
  },
  {
    code: "PACK",
    name: "Pack Identité",
    priceGnf: 150_000,
    interval: null,
    monthlyCredits: 0,
    includedCredits: 100,
    maxMembers: 1,
    features: ["pack.project", "pack.noWatermark", "pack.guide", "pack.stamp", "pack.credits"],
    highlighted: true,
  },
  {
    code: "ASSOCIATION",
    name: "Association",
    priceGnf: 90_000,
    interval: null,
    monthlyCredits: 0,
    includedCredits: 100,
    maxMembers: 3,
    features: ["association.pack", "association.proof"],
  },
  {
    code: "PRO",
    name: "Pro",
    priceGnf: 250_000,
    interval: "month",
    monthlyCredits: 500,
    includedCredits: 0,
    maxMembers: 5,
    features: ["pro.projects", "pro.credits", "pro.members", "pro.batch"],
  },
  {
    code: "AGENCY",
    name: "Agence",
    priceGnf: 900_000,
    interval: "month",
    monthlyCredits: 2000,
    includedCredits: 0,
    maxMembers: 15,
    features: ["agency.credits", "agency.spaces", "agency.members"],
  },
];
