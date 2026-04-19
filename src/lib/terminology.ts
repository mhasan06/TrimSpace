export type ShopCategory = 'BARBER' | 'SALON' | 'SPA' | 'TATTOO';

export interface Terminology {
  staffLabel: string;
  staffLabelPlural: string;
  serviceLabel: string;
  serviceLabelPlural: string;
  actionVerb: string;
  rosterLabel: string;
  industryIcon: string;
}

const terms: Record<ShopCategory, Terminology> = {
  BARBER: {
    staffLabel: "Barber",
    staffLabelPlural: "Barbers",
    serviceLabel: "Cut & Fade",
    serviceLabelPlural: "Services",
    actionVerb: "Trim",
    rosterLabel: "My Team",
    industryIcon: "💈"
  },
  SALON: {
    staffLabel: "Stylist",
    staffLabelPlural: "Stylists",
    serviceLabel: "Treatment",
    serviceLabelPlural: "Treatments",
    actionVerb: "Style",
    rosterLabel: "My Team",
    industryIcon: "✂️"
  },
  SPA: {
    staffLabel: "Therapist",
    staffLabelPlural: "Therapists",
    serviceLabel: "Ritual",
    serviceLabelPlural: "Rituals",
    actionVerb: "Heal",
    rosterLabel: "My Team",
    industryIcon: "💆"
  },
  TATTOO: {
    staffLabel: "Artist",
    staffLabelPlural: "Artists",
    serviceLabel: "Session",
    serviceLabelPlural: "Sessions",
    actionVerb: "Inkers",
    rosterLabel: "My Team",
    industryIcon: "🖋️"
  }
};

export function getTerminology(category: string | null | undefined): Terminology {
  const cat = (category?.toUpperCase() || 'BARBER') as ShopCategory;
  return terms[cat] || terms.BARBER;
}
