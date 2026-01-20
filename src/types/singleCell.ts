export interface Cell {
  id: string;
  x: number; // UMAP/tSNE coordinate
  y: number;
  cluster: number;
  metadata: Record<string, string | number>;
}

export interface GeneExpression {
  geneId: string;
  geneName: string;
  values: Map<string, number>; // cellId -> expression value
}

export interface DifferentialExpression {
  gene: string;
  cluster: string;
  logFC: number;
  pValue: number;
  pAdj: number;
}

export interface ClusterInfo {
  id: number;
  name: string;
  cellCount: number;
  color: string;
}

export interface DatasetMetadata {
  name: string;
  description: string;
  cellCount: number;
  geneCount: number;
  clusterCount: number;
  organism?: string;
  tissue?: string;
  source?: string;
}

export interface SingleCellDataset {
  metadata: DatasetMetadata;
  cells: Cell[];
  genes: string[];
  clusters: ClusterInfo[];
  differentialExpression: DifferentialExpression[];
}

export type ColorPalette = 'viridis' | 'magma' | 'plasma' | 'inferno' | 'grrd' | 'blues';

export interface VisualizationSettings {
  pointSize: number;
  showClusters: boolean;
  showLabels: boolean;
  colorPalette: ColorPalette;
  selectedGene: string | null;
  opacity: number;
}
