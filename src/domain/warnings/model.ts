export type WarningCode = "UNKNOWN_CHARACTER" | "ODD_PUNCH_COUNT" | "EMPTY_HOLERITE_PAGE" | "NON_SEQUENTIAL_DATE" | "NON_SEQUENTIAL_MONTH" | "PAYROLL_CALCULATION_DIVERGENCE";
export interface DerivedWarning { code: WarningCode; tone: "yellow" | "red"; message: string; }
export interface RowPresentation { warnings: DerivedWarning[]; fill: "#FFF3CD" | "#F8D7DA" | null; firstCellLeftBorder: "#DC3545" | null; }
