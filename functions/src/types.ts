import { z } from 'zod';

export type PayslipStatus = 'uploaded' | 'processing' | 'done' | 'error';

export interface PayslipDocument {
  userId: string;
  year: number;
  month: number;
  storagePath: string;
  status: PayslipStatus;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  errorMessage?: string;
  sourceTextPreview?: string;
}

// Zod schema per validazione output Gemini
export const GeminiOutputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  paga_base: z.number().nullable(),
  ferie: z.object({
    maturate: z.number().nullable(),
    godute: z.number().nullable(),
    residue: z.number().nullable(),
  }),
  permessi: z.object({
    maturati: z.number().nullable(),
    goduti: z.number().nullable(),
    residui: z.number().nullable(),
  }),
  rol: z.object({
    maturati: z.number().nullable(),
    goduti: z.number().nullable(),
    residui: z.number().nullable(),
  }),
  tfr: z.object({
    quota_mese: z.number().nullable(),
    progressivo: z.number().nullable(),
  }),
  malattia: z.object({
    giorni: z.number().nullable(),
    ore: z.number().nullable(),
    trattenute: z.number().nullable(),
  }),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

export type GeminiOutput = z.infer<typeof GeminiOutputSchema>;

export interface AnalysisResult {
  extracted: GeminiOutput;
  rawModelOutput: string;
  confidence: number;
  warnings: string[];
  createdAt: FirebaseFirestore.Timestamp;
}

export interface MonthlyData {
  year: number;
  month: number;
  paga_base: number | null;
  ferie: {
    maturate: number | null;
    godute: number | null;
    residue: number | null;
  };
  permessi: {
    maturati: number | null;
    goduti: number | null;
    residui: number | null;
  };
  rol: {
    maturati: number | null;
    goduti: number | null;
    residui: number | null;
  };
  tfr: {
    quota_mese: number | null;
    progressivo: number | null;
  };
  malattia: {
    giorni: number | null;
    ore: number | null;
    trattenute: number | null;
  };
  sourcePayslipId: string;
  updatedAt: FirebaseFirestore.Timestamp;
}
