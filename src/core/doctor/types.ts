export interface DoctorDimensionResult {
  name: string;
  score: number;
  max: number;
  notes: string[];
}

export interface DoctorReport {
  score: number;
  dimensions: DoctorDimensionResult[];
  topActions: string[];
}
