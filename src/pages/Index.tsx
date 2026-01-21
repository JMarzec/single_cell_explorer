import React, { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ScatterPlot } from "@/components/scatter/ScatterPlot";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { DifferentialExpressionTable } from "@/components/table/DifferentialExpressionTable";
import { ViolinPlot } from "@/components/plots/ViolinPlot";
import { FeaturePlot } from "@/components/plots/FeaturePlot";
import { DatasetUploader } from "@/components/upload/DatasetUploader";
import { generateDemoDataset, getGeneExpression } from "@/data/demoData";
import { VisualizationSettings, SingleCellDataset } from "@/types/singleCell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelLeft, PanelLeftClose } from "lucide-react";

// Generate two demo datasets for side-by-side comparison
const defaultDataset1 = generateDemoDataset(15000);
const defaultDataset2: SingleCellDataset = {
  ...generateDemoDataset(12000),
  metadata: {
    ...generateDemoDataset(12000).metadata,
    name: "Heart Development - E14.5",
    description: "Developing mouse heart at E14.5, companion dataset for comparative analysis."
  }
};

const Index = () => {
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [dataset1, setDataset1] = useState<SingleCellDataset>(defaultDataset1);
  const [dataset2, setDataset2] = useState<SingleCellDataset>(defaultDataset2);
  
  // Settings for left/single panel
  const [settings1, setSettings1] = useState<VisualizationSettings>({
    pointSize: 2,
    showClusters: true,
    showLabels: true,
    colorPalette: "viridis",
    selectedGene: null,
    opacity: 0.8,
  });

  // Settings for right panel (side-by-side mode)
  const [settings2, setSettings2] = useState<VisualizationSettings>({
    pointSize: 2,
    showClusters: true,
    showLabels: true,
    colorPalette: "viridis",
    selectedGene: null,
    opacity: 0.8,
  });

  const handleSettingsChange1 = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      setSettings1((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleSettingsChange2 = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      setSettings2((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const expressionData1 = useMemo(() => {
    if (!settings1.selectedGene) return undefined;
    return getGeneExpression(dataset1.cells, settings1.selectedGene);
  }, [settings1.selectedGene, dataset1.cells]);

  const expressionData2 = useMemo(() => {
    if (!settings2.selectedGene) return undefined;
    return getGeneExpression(dataset2.cells, settings2.selectedGene);
  }, [settings2.selectedGene, dataset2.cells]);

  const handleDatasetLoad1 = useCallback((newDataset: SingleCellDataset) => {
    setDataset1(newDataset);
    setSettings1(prev => ({ ...prev, selectedGene: null }));
  }, []);

  const handleDatasetLoad2 = useCallback((newDataset: SingleCellDataset) => {
    setDataset2(newDataset);
    setSettings2(prev => ({ ...prev, selectedGene: null }));
  }, []);

  const handleGeneClick1 = useCallback((gene: string) => {
    setSettings1((prev) => ({ ...prev, selectedGene: gene }));
  }, []);

  const handleGeneClick2 = useCallback((gene: string) => {
    setSettings2((prev) => ({ ...prev, selectedGene: gene }));
  }, []);

  const clusterNames1 = useMemo(
    () => dataset1.clusters.map((c) => c.name),
    [dataset1.clusters]
  );

  const clusterNames2 = useMemo(
    () => dataset2.clusters.map((c) => c.name),
    [dataset2.clusters]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header metadata={dataset1.metadata} />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Controls row */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
            {showSideBySide ? (
              <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
            ) : (
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="side-by-side" className="text-sm font-medium cursor-pointer">
              Side-by-side comparison
            </Label>
            <Switch
              id="side-by-side"
              checked={showSideBySide}
              onCheckedChange={setShowSideBySide}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DatasetUploader 
              onDatasetLoad={handleDatasetLoad1} 
              buttonVariant="outline"
            />
            {showSideBySide && (
              <DatasetUploader 
                onDatasetLoad={handleDatasetLoad2} 
                buttonVariant="ghost"
              />
            )}
          </div>
        </div>

        {showSideBySide ? (
          // Side-by-side layout
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Dataset */}
              <div className="space-y-4">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <h2 className="font-semibold text-foreground">{dataset1.metadata.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dataset1.metadata.cellCount.toLocaleString()} cells • {dataset1.metadata.clusterCount} clusters
                  </p>
                </div>
                <div className="h-[400px]">
                  <ScatterPlot
                    cells={dataset1.cells}
                    expressionData={expressionData1}
                    selectedGene={settings1.selectedGene}
                    pointSize={settings1.pointSize}
                    showClusters={settings1.showClusters}
                    showLabels={settings1.showLabels}
                    opacity={settings1.opacity}
                    clusterNames={clusterNames1}
                  />
                </div>
                <ControlPanel
                  genes={dataset1.genes}
                  clusters={dataset1.clusters}
                  settings={settings1}
                  onSettingsChange={handleSettingsChange1}
                />
                {settings1.selectedGene && (
                  <ViolinPlot 
                    cells={dataset1.cells} 
                    gene={settings1.selectedGene} 
                    clusters={dataset1.clusters}
                  />
                )}
              </div>

              {/* Right Dataset */}
              <div className="space-y-4">
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <h2 className="font-semibold text-foreground">{dataset2.metadata.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dataset2.metadata.cellCount.toLocaleString()} cells • {dataset2.metadata.clusterCount} clusters
                  </p>
                </div>
                <div className="h-[400px]">
                  <ScatterPlot
                    cells={dataset2.cells}
                    expressionData={expressionData2}
                    selectedGene={settings2.selectedGene}
                    pointSize={settings2.pointSize}
                    showClusters={settings2.showClusters}
                    showLabels={settings2.showLabels}
                    opacity={settings2.opacity}
                    clusterNames={clusterNames2}
                  />
                </div>
                <ControlPanel
                  genes={dataset2.genes}
                  clusters={dataset2.clusters}
                  settings={settings2}
                  onSettingsChange={handleSettingsChange2}
                />
                {settings2.selectedGene && (
                  <ViolinPlot 
                    cells={dataset2.cells} 
                    gene={settings2.selectedGene} 
                    clusters={dataset2.clusters}
                  />
                )}
              </div>
            </div>

            {/* Differential Expression Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DifferentialExpressionTable
                data={dataset1.differentialExpression}
                onGeneClick={handleGeneClick1}
              />
              <DifferentialExpressionTable
                data={dataset2.differentialExpression}
                onGeneClick={handleGeneClick2}
              />
            </div>
          </div>
        ) : (
          // Single view layout
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Control Panel - Left Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <ControlPanel
                genes={dataset1.genes}
                clusters={dataset1.clusters}
                settings={settings1}
                onSettingsChange={handleSettingsChange1}
              />
            </div>

            {/* Main Visualization Area */}
            <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
              {/* Scatter Plot */}
              <div className="h-[500px]">
                <ScatterPlot
                  cells={dataset1.cells}
                  expressionData={expressionData1}
                  selectedGene={settings1.selectedGene}
                  pointSize={settings1.pointSize}
                  showClusters={settings1.showClusters}
                  showLabels={settings1.showLabels}
                  opacity={settings1.opacity}
                  clusterNames={clusterNames1}
                />
              </div>

              {/* Violin and Feature Plots */}
              {settings1.selectedGene && (
                <Tabs defaultValue="violin" className="w-full">
                  <TabsList>
                    <TabsTrigger value="violin">Violin Plot</TabsTrigger>
                    <TabsTrigger value="feature">Feature Plot</TabsTrigger>
                  </TabsList>
                  <TabsContent value="violin">
                    <ViolinPlot 
                      cells={dataset1.cells} 
                      gene={settings1.selectedGene} 
                      clusters={dataset1.clusters}
                    />
                  </TabsContent>
                  <TabsContent value="feature">
                    <FeaturePlot 
                      cells={dataset1.cells} 
                      gene={settings1.selectedGene} 
                      clusters={dataset1.clusters}
                    />
                  </TabsContent>
                </Tabs>
              )}

              {/* Differential Expression Table */}
              <DifferentialExpressionTable
                data={dataset1.differentialExpression}
                onGeneClick={handleGeneClick1}
              />
            </div>
          </div>
        )}

        {/* Dataset Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">About this dataset:</strong>{" "}
            {dataset1.metadata.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {dataset1.metadata.organism && (
              <span>
                <strong>Organism:</strong> {dataset1.metadata.organism}
              </span>
            )}
            {dataset1.metadata.tissue && (
              <span>
                <strong>Tissue:</strong> {dataset1.metadata.tissue}
              </span>
            )}
            {dataset1.metadata.source && (
              <span>
                <strong>Source:</strong> {dataset1.metadata.source}
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