export declare const PROJECT_PHASES: readonly ["Pre-Construction", "Site Preparation", "Earthwork", "Foundation", "Piling", "Structural / RCC", "Masonry", "Roofing", "Plastering", "Flooring & Tiles", "Doors & Windows", "Electrical", "Plumbing & Sanitary", "Painting & Finishing", "External Works"];
export type ProjectPhase = (typeof PROJECT_PHASES)[number];
export declare const PHASE_SUBCATEGORIES_MAP: Record<ProjectPhase, readonly string[]>;
export declare const PHASE_ALIASES: Record<string, ProjectPhase>;
export declare function normalizePhaseName(phase?: string | null): string;
export declare function getValidSubcategories(phase?: string | null): readonly string[];
export declare function validatePhaseSubcategory(phase?: string | null, subcategory?: string | null): {
    valid: boolean;
    normalizedPhase: string;
    normalizedSubcategory: string;
};
//# sourceMappingURL=phase-subcategories.d.ts.map