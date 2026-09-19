export const PROJECT_PHASES = [
  "Pre-Construction",
  "Site Preparation",
  "Earthwork",
  "Foundation",
  "Piling",
  "Structural / RCC",
  "Masonry",
  "Roofing",
  "Plastering",
  "Flooring & Tiles",
  "Doors & Windows",
  "Electrical",
  "Plumbing & Sanitary",
  "Painting & Finishing",
  "External Works",
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PHASE_SUBCATEGORIES_MAP: Record<ProjectPhase, readonly string[]> = {
  "Pre-Construction": [
    "Design & Drawing",
    "Soil Test",
    "Survey",
    "Approval & Permit",
    "Project Management",
  ],
  "Site Preparation": [
    "Site Clearing",
    "Demolition",
    "Site Leveling",
    "Temporary Setup",
    "Site Security",
  ],
  "Earthwork": [
    "Excavation",
    "Earth Filling",
    "Sand Filling",
    "Backfilling",
    "Soil Disposal",
    "Compaction",
  ],
  "Foundation": [
    "PCC",
    "Footing",
    "Foundation Wall",
    "Grade Beam",
    "DPC",
    "Waterproofing",
    "Anti-Termite Treatment",
  ],
  "Piling": [
    "Pile Work",
    "Pile Reinforcement",
    "Pile Concrete",
    "Pile Testing",
    "Pile Cap",
  ],
  "Structural / RCC": [
    "Column",
    "Beam",
    "Slab",
    "Staircase",
    "Lintel & Chajja",
    "Reinforcement Steel",
    "Formwork",
    "Concrete",
  ],
  "Masonry": [
    "Brickwork",
    "Blockwork",
    "Partition Wall",
    "Boundary Wall",
    "Lintel & Opening",
  ],
  "Roofing": [
    "Roof Slab",
    "Roof Waterproofing",
    "Roof Insulation",
    "Roof Screed",
    "Parapet",
    "Roof Drainage",
  ],
  "Plastering": [
    "Internal Plaster",
    "External Plaster",
    "Ceiling Plaster",
    "Waterproof Plaster",
    "Surface Preparation",
  ],
  "Flooring & Tiles": [
    "Floor Tiles",
    "Wall Tiles",
    "Stair Tiles",
    "Marble & Granite",
    "Skirting",
    "Tile Adhesive & Grouting",
  ],
  "Doors & Windows": [
    "Main Door",
    "Internal Doors",
    "Toilet Doors",
    "Windows",
    "Glass",
    "Door & Window Hardware",
  ],
  "Electrical": [
    "Wiring",
    "Conduit",
    "Switch & Socket",
    "Lighting",
    "DB & Protection",
    "Earthing",
    "AC & Fan Points",
    "CCTV / LAN",
  ],
  "Plumbing & Sanitary": [
    "Water Supply",
    "Drainage",
    "Sewerage",
    "Sanitary Fixtures",
    "Kitchen Plumbing",
    "Water Tank",
    "Pump",
    "Septic / Inspection Chamber",
  ],
  "Painting & Finishing": [
    "Wall Putty",
    "Primer",
    "Interior Paint",
    "Exterior Paint",
    "Ceiling Paint",
    "Metal / Wood Paint",
    "Final Touch-up",
  ],
  "External Works": [
    "Boundary Wall",
    "Main Gate",
    "Driveway",
    "Footpath / Paving",
    "Drainage",
    "Landscaping",
    "External Electrical",
    "External Plumbing",
  ],
};

// Aliases for historical / alternate spellings
export const PHASE_ALIASES: Record<string, ProjectPhase> = {
  "foundation & substructure": "Foundation",
  "piling & deep foundation": "Piling",
  "earthwork & excavation": "Earthwork",
  "superstructure (columns & slabs)": "Structural / RCC",
  "brickwork & masonry": "Masonry",
  "plastering & concrete works": "Plastering",
  "roofing & roof works": "Roofing",
  "tiles & marble finishing": "Flooring & Tiles",
  "doors, windows & glass": "Doors & Windows",
  "electrical works & fittings": "Electrical",
  "plumbing & sanitary": "Plumbing & Sanitary",
  "painting & waterproofing": "Painting & Finishing",
  "external works & development": "External Works",
  "pre-construction & site preparation": "Pre-Construction",
};

export function normalizePhaseName(phase?: string | null): string {
  if (!phase) return "General";
  const trimmed = phase.trim();
  const lower = trimmed.toLowerCase();
  if (PHASE_ALIASES[lower]) return PHASE_ALIASES[lower];
  const matched = PROJECT_PHASES.find((p) => p.toLowerCase() === lower);
  return matched || trimmed;
}

export function getValidSubcategories(phase?: string | null): readonly string[] {
  if (!phase) return [];
  const normalized = normalizePhaseName(phase) as ProjectPhase;
  return PHASE_SUBCATEGORIES_MAP[normalized] || [];
}

export function validatePhaseSubcategory(
  phase?: string | null,
  subcategory?: string | null
): { valid: boolean; normalizedPhase: string; normalizedSubcategory: string } {
  const normPhase = normalizePhaseName(phase);
  if (!subcategory || !subcategory.trim()) {
    return { valid: true, normalizedPhase: normPhase, normalizedSubcategory: "" };
  }
  const subTrim = subcategory.trim();
  const validSubs = getValidSubcategories(normPhase);
  const found = validSubs.find((s) => s.toLowerCase() === subTrim.toLowerCase());
  return {
    valid: true,
    normalizedPhase: normPhase,
    normalizedSubcategory: found || subTrim,
  };
}
