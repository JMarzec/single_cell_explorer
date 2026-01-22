import { Cell, SingleCellDataset } from "@/types/singleCell";
import { getGeneExpression as getDemoGeneExpression } from "@/data/demoData";

/**
 * Get gene expression data from the dataset.
 * Uses real expression data if available, falls back to demo data generation.
 */
export function getExpressionData(
  dataset: SingleCellDataset,
  gene: string
): Map<string, number> {
  // Check if dataset has real expression data
  if (dataset.expression && dataset.expression[gene]) {
    const exprData = dataset.expression[gene];
    return new Map(Object.entries(exprData));
  }
  
  // Fallback to demo data generation
  return getDemoGeneExpression(dataset.cells, gene);
}

/**
 * Get expression values for multiple genes.
 */
export function getMultiGeneExpression(
  dataset: SingleCellDataset,
  genes: string[]
): Record<string, Map<string, number>> {
  const result: Record<string, Map<string, number>> = {};
  
  for (const gene of genes) {
    result[gene] = getExpressionData(dataset, gene);
  }
  
  return result;
}

/**
 * Get unique values for a metadata annotation.
 */
export function getAnnotationValues(
  cells: Cell[],
  annotation: string
): string[] {
  const values = new Set<string>();
  cells.forEach(cell => {
    const value = cell.metadata[annotation];
    if (value !== undefined && value !== null) {
      values.add(String(value));
    }
  });
  return Array.from(values).sort();
}

/**
 * Create a color mapping for annotation values.
 */
export function getAnnotationColorMap(
  values: string[]
): Record<string, string> {
  const colors: Record<string, string> = {};
  const palette = [
    [52, 152, 165],   // teal
    [215, 95, 130],   // pink
    [210, 180, 60],   // gold
    [90, 165, 110],   // green
    [165, 105, 180],  // purple
    [215, 130, 65],   // orange
    [75, 170, 155],   // teal-green
    [190, 100, 165],  // magenta
    [130, 170, 85],   // lime
    [100, 140, 200],  // blue
    [180, 80, 80],    // red
    [120, 100, 160],  // lavender
  ];
  
  values.forEach((value, idx) => {
    const color = palette[idx % palette.length];
    colors[value] = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  });
  
  return colors;
}
