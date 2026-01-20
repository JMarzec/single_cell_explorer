import React, { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ScatterPlot } from "@/components/scatter/ScatterPlot";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { DifferentialExpressionTable } from "@/components/table/DifferentialExpressionTable";
import { generateDemoDataset, getGeneExpression } from "@/data/demoData";
import { VisualizationSettings } from "@/types/singleCell";

const demoDataset = generateDemoDataset(15000);

const Index = () => {
  const [settings, setSettings] = useState<VisualizationSettings>({
    pointSize: 2,
    showClusters: true,
    showLabels: true,
    colorPalette: "viridis",
    selectedGene: null,
    opacity: 0.8,
  });

  const handleSettingsChange = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const expressionData = useMemo(() => {
    if (!settings.selectedGene) return undefined;
    return getGeneExpression(demoDataset.cells, settings.selectedGene);
  }, [settings.selectedGene]);

  const handleGeneClick = useCallback((gene: string) => {
    setSettings((prev) => ({ ...prev, selectedGene: gene }));
  }, []);

  const clusterNames = useMemo(
    () => demoDataset.clusters.map((c) => c.name),
    []
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header metadata={demoDataset.metadata} />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel - Left Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ControlPanel
              genes={demoDataset.genes}
              clusters={demoDataset.clusters}
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {/* Scatter Plot */}
            <div className="h-[500px]">
              <ScatterPlot
                cells={demoDataset.cells}
                expressionData={expressionData}
                selectedGene={settings.selectedGene}
                pointSize={settings.pointSize}
                showClusters={settings.showClusters}
                showLabels={settings.showLabels}
                opacity={settings.opacity}
                clusterNames={clusterNames}
              />
            </div>

            {/* Differential Expression Table */}
            <DifferentialExpressionTable
              data={demoDataset.differentialExpression}
              onGeneClick={handleGeneClick}
            />
          </div>
        </div>

        {/* Dataset Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">About this dataset:</strong>{" "}
            {demoDataset.metadata.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {demoDataset.metadata.organism && (
              <span>
                <strong>Organism:</strong> {demoDataset.metadata.organism}
              </span>
            )}
            {demoDataset.metadata.tissue && (
              <span>
                <strong>Tissue:</strong> {demoDataset.metadata.tissue}
              </span>
            )}
            {demoDataset.metadata.source && (
              <span>
                <strong>Source:</strong> {demoDataset.metadata.source}
              </span>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Single-Cell RNA-seq Data Portal • Built with Lovable
        </div>
      </footer>
    </div>
  );
};

export default Index;
