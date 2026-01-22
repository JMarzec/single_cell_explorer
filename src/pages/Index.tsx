import React, { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ScatterPlot } from "@/components/scatter/ScatterPlot";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { CellFilter } from "@/components/controls/CellFilter";
import { DifferentialExpressionTable } from "@/components/table/DifferentialExpressionTable";
import { ViolinPlot } from "@/components/plots/ViolinPlot";
import { FeaturePlot } from "@/components/plots/FeaturePlot";
import { DotPlot } from "@/components/plots/DotPlot";
import { PathwayEnrichment } from "@/components/analysis/PathwayEnrichment";
import { DatasetUploader } from "@/components/upload/DatasetUploader";
import { generateDemoDataset } from "@/data/demoData";
import { getExpressionData, getMultiGeneExpression, getAnnotationValues, getAnnotationColorMap } from "@/lib/expressionUtils";
import { VisualizationSettings, SingleCellDataset, CellFilterState as CellFilterType, Cell } from "@/types/singleCell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generate demo dataset
const defaultDataset = generateDemoDataset(15000);

const defaultCellFilter: CellFilterType = {
  selectedSamples: [],
  selectedClusters: [],
};

const Index = () => {
  const [dataset, setDataset] = useState<SingleCellDataset>(defaultDataset);
  
  // Selected cells from lasso/rectangle selection
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  
  // Annotation selection for left plot
  const [selectedAnnotation, setSelectedAnnotation] = useState<string>("cell_type");
  
  // Settings for visualization
  const [settings, setSettings] = useState<VisualizationSettings>({
    pointSize: 2,
    showClusters: true,
    showLabels: true,
    colorPalette: "viridis",
    selectedGene: null,
    selectedGenes: [],
    opacity: 0.8,
    cellFilter: defaultCellFilter,
  });

  const handleSettingsChange = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Get expression data for selected gene
  const expressionData = useMemo(() => {
    if (!settings.selectedGene) return undefined;
    return getExpressionData(dataset, settings.selectedGene);
  }, [settings.selectedGene, dataset]);

  // Get expression data for all selected genes (for dot plot)
  const multiGeneExpressionData = useMemo(() => {
    const genes = settings.selectedGenes || [];
    if (genes.length === 0) return {};
    return getMultiGeneExpression(dataset, genes);
  }, [settings.selectedGenes, dataset]);

  const handleDatasetLoad = useCallback((newDataset: SingleCellDataset) => {
    setDataset(newDataset);
    setSettings(prev => ({ ...prev, selectedGene: null, selectedGenes: [], cellFilter: defaultCellFilter }));
    // Set default annotation if cell_type exists
    const annotations = newDataset.annotationOptions || [];
    if (annotations.includes("cell_type")) {
      setSelectedAnnotation("cell_type");
    } else if (annotations.length > 0) {
      setSelectedAnnotation(annotations[0]);
    }
  }, []);

  const handleGeneClick = useCallback((gene: string) => {
    setSettings((prev) => ({ ...prev, selectedGene: gene }));
  }, []);

  const clusterNames = useMemo(
    () => dataset.clusters.map((c) => c.name),
    [dataset.clusters]
  );

  // Get annotation options for the left plot
  const annotationOptions = useMemo(() => {
    const options = dataset.annotationOptions || [];
    // Always include cluster as an option
    if (!options.includes("cluster")) {
      return ["cluster", ...options];
    }
    return options;
  }, [dataset.annotationOptions]);

  // Get annotation values and colors for current selection
  const annotationData = useMemo(() => {
    if (selectedAnnotation === "cluster") {
      return {
        values: dataset.clusters.map(c => c.name),
        colorMap: Object.fromEntries(dataset.clusters.map(c => [c.name, c.color])),
        getCellValue: (cell: Cell) => dataset.clusters[cell.cluster]?.name || `Cluster ${cell.cluster}`,
      };
    }
    
    const values = getAnnotationValues(dataset.cells, selectedAnnotation);
    const colorMap = getAnnotationColorMap(values);
    
    return {
      values,
      colorMap,
      getCellValue: (cell: Cell) => String(cell.metadata[selectedAnnotation] || "Unknown"),
    };
  }, [dataset, selectedAnnotation]);

  // Get genes from selected cells for pathway analysis
  const selectedCellGenes = useMemo(() => {
    if (selectedCells.length === 0) return settings.selectedGenes || [];
    return settings.selectedGenes || [];
  }, [selectedCells.length, settings.selectedGenes]);

  const handleCellsSelected = useCallback((cells: Cell[]) => {
    setSelectedCells(cells);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header metadata={dataset.metadata} />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Controls row */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <DatasetUploader 
            onDatasetLoad={handleDatasetLoad} 
            buttonVariant="outline"
          />
          
          <Button variant="ghost" size="sm" asChild>
            <a href="/export_template.R" download className="gap-2">
              <Download className="h-4 w-4" />
              R Export Script
            </a>
          </Button>
        </div>

        {/* Dual Plot Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Plot - Metadata Annotation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground">Metadata Annotation</h3>
              <Select value={selectedAnnotation} onValueChange={setSelectedAnnotation}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select annotation" />
                </SelectTrigger>
                <SelectContent>
                  {annotationOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-[450px]">
              <ScatterPlot
                cells={dataset.cells}
                selectedGene={null}
                pointSize={settings.pointSize}
                showClusters={true}
                showLabels={settings.showLabels}
                opacity={settings.opacity}
                clusterNames={clusterNames}
                cellFilter={settings.cellFilter}
                annotationData={annotationData}
                onCellsSelected={handleCellsSelected}
              />
            </div>
            
            {/* Annotation Legend */}
            <div className="bg-card border border-border rounded-lg p-3">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {selectedAnnotation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {annotationData.values.slice(0, 20).map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: annotationData.colorMap[value] }}
                      />
                      <span className="text-muted-foreground truncate">{value}</span>
                    </div>
                  ))}
                  {annotationData.values.length > 20 && (
                    <div className="text-xs text-muted-foreground col-span-2">
                      +{annotationData.values.length - 20} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Plot - Gene Expression */}
          <div className="space-y-4">
            <div className="p-3 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground">
                Gene Expression
                {settings.selectedGene && (
                  <span className="ml-2 text-primary font-mono text-sm">({settings.selectedGene})</span>
                )}
              </h3>
            </div>
            
            <div className="h-[450px]">
              <ScatterPlot
                cells={dataset.cells}
                expressionData={expressionData}
                selectedGene={settings.selectedGene}
                pointSize={settings.pointSize}
                showClusters={!settings.selectedGene}
                showLabels={settings.showLabels}
                opacity={settings.opacity}
                clusterNames={clusterNames}
                cellFilter={settings.cellFilter}
                onCellsSelected={handleCellsSelected}
              />
            </div>
            
            {/* Expression Color Legend */}
            {settings.selectedGene && (
              <div className="bg-card border border-border rounded-lg p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Expression Level</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Low</span>
                  <div 
                    className="flex-1 h-3 rounded"
                    style={{
                      background: 'linear-gradient(to right, rgb(180, 180, 180), rgb(255, 255, 255) 50%, rgb(255, 75, 55))'
                    }}
                  />
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <ControlPanel
              genes={dataset.genes}
              clusters={dataset.clusters}
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            <CellFilter
              cells={dataset.cells}
              clusters={dataset.clusters}
              filter={settings.cellFilter}
              onFilterChange={(filter) => handleSettingsChange({ cellFilter: filter })}
            />
          </div>

          {/* Analysis Tabs */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="violin" className="w-full">
              <TabsList>
                <TabsTrigger value="violin" disabled={!settings.selectedGene}>
                  Violin Plot
                </TabsTrigger>
                <TabsTrigger value="feature" disabled={!settings.selectedGene}>
                  Feature Plot
                </TabsTrigger>
                <TabsTrigger value="dotplot">
                  Dot Plot
                </TabsTrigger>
                <TabsTrigger value="enrichment">
                  Pathway Enrichment
                </TabsTrigger>
              </TabsList>
              <TabsContent value="violin">
                {settings.selectedGene && expressionData ? (
                  <ViolinPlot 
                    cells={dataset.cells} 
                    gene={settings.selectedGene} 
                    clusters={dataset.clusters}
                    expressionData={expressionData}
                  />
                ) : (
                  <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Select a gene to display violin plot</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="feature">
                {settings.selectedGene && expressionData ? (
                  <FeaturePlot 
                    cells={dataset.cells} 
                    gene={settings.selectedGene} 
                    clusters={dataset.clusters}
                    expressionData={expressionData}
                  />
                ) : (
                  <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Select a gene to display feature plot</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="dotplot">
                <DotPlot
                  cells={dataset.cells}
                  genes={settings.selectedGenes || []}
                  clusters={dataset.clusters}
                  expressionDataMap={multiGeneExpressionData}
                />
              </TabsContent>
              <TabsContent value="enrichment">
                <PathwayEnrichment
                  genes={selectedCellGenes}
                  onGeneClick={handleGeneClick}
                />
              </TabsContent>
            </Tabs>

            {/* Differential Expression Table */}
            <DifferentialExpressionTable
              data={dataset.differentialExpression}
              onGeneClick={handleGeneClick}
            />
          </div>
        </div>

        {/* Dataset Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">About this dataset:</strong>{" "}
            {dataset.metadata.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {dataset.metadata.organism && (
              <span>
                <strong>Organism:</strong> {dataset.metadata.organism}
              </span>
            )}
            {dataset.metadata.tissue && (
              <span>
                <strong>Tissue:</strong> {dataset.metadata.tissue}
              </span>
            )}
            {dataset.metadata.source && (
              <span>
                <strong>Source:</strong> {dataset.metadata.source}
              </span>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Single-Cell RNA-seq Data Portal • Powered by{" "}
          <span className="font-semibold text-primary">AccelBio</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
