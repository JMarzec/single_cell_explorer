import React from "react";
import { GeneSearch } from "./GeneSearch";
import { MultiGeneSearch } from "./MultiGeneSearch";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ClusterInfo, VisualizationSettings } from "@/types/singleCell";

interface ControlPanelProps {
  genes: string[];
  clusters: ClusterInfo[];
  settings: VisualizationSettings;
  onSettingsChange: (settings: Partial<VisualizationSettings>) => void;
}

export function ControlPanel({
  genes,
  clusters,
  settings,
  onSettingsChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-6 p-4 bg-card border border-border rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Gene Expression (Scatter)</h3>
        <GeneSearch
          genes={genes}
          selectedGene={settings.selectedGene}
          onGeneSelect={(gene) => onSettingsChange({ selectedGene: gene })}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Multi-Gene Selection</h3>
        <MultiGeneSearch
          genes={genes}
          selectedGenes={settings.selectedGenes}
          onGenesSelect={(selectedGenes) => onSettingsChange({ selectedGenes })}
          maxGenes={20}
        />
        {settings.selectedGenes.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <div>
              <Label htmlFor="show-averaged" className="text-sm">
                Show Averaged Expression
              </Label>
              <p className="text-xs text-muted-foreground">Display on scatter plot</p>
            </div>
            <Switch
              id="show-averaged"
              checked={settings.showAveragedExpression}
              onCheckedChange={(checked) => onSettingsChange({ showAveragedExpression: checked })}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Display Options</h3>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Point Size</Label>
          <Slider
            value={[settings.pointSize]}
            min={0.5}
            max={5}
            step={0.1}
            onValueChange={([value]) => onSettingsChange({ pointSize: value })}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5</span>
            <span className="font-mono">{settings.pointSize.toFixed(1)}</span>
            <span>5</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Opacity</Label>
          <Slider
            value={[settings.opacity]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={([value]) => onSettingsChange({ opacity: value })}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10%</span>
            <span className="font-mono">{Math.round(settings.opacity * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Expression Scale {settings.selectedGene ? `(${settings.selectedGene})` : ''}
          </Label>
          <Slider
            value={[settings.expressionScale]}
            min={0.1}
            max={3}
            step={0.1}
            onValueChange={([value]) => onSettingsChange({ expressionScale: value })}
            disabled={!settings.selectedGene && settings.selectedGenes.length === 0}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span className="font-mono">{settings.expressionScale.toFixed(1)}x</span>
            <span>High</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="percentile-clipping" className="text-sm">
              Percentile Clipping
            </Label>
            <p className="text-xs text-muted-foreground">Clip outliers for better contrast</p>
          </div>
          <Switch
            id="percentile-clipping"
            checked={settings.usePercentileClipping}
            onCheckedChange={(checked) => onSettingsChange({ usePercentileClipping: checked })}
            disabled={!settings.selectedGene && settings.selectedGenes.length === 0}
          />
        </div>

        {settings.usePercentileClipping && (
          <div className="space-y-2 pl-2 border-l-2 border-primary/20">
            <Label className="text-xs text-muted-foreground">
              Percentile Range ({settings.percentileLow}% - {settings.percentileHigh}%)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs w-8">{settings.percentileLow}%</span>
              <Slider
                value={[settings.percentileLow, settings.percentileHigh]}
                min={0}
                max={100}
                step={1}
                onValueChange={([low, high]) => {
                  if (low < high) {
                    onSettingsChange({ percentileLow: low, percentileHigh: high });
                  }
                }}
              />
              <span className="text-xs w-8">{settings.percentileHigh}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="show-clusters" className="text-sm">
            Show Clusters
          </Label>
          <Switch
            id="show-clusters"
            checked={settings.showClusters}
            onCheckedChange={(checked) => onSettingsChange({ showClusters: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels" className="text-sm">
            Show Labels
          </Label>
          <Switch
            id="show-labels"
            checked={settings.showLabels}
            onCheckedChange={(checked) => onSettingsChange({ showLabels: checked })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Cluster Legend</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary transition-colors cursor-pointer"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cluster.color }}
              />
              <span className="text-sm text-foreground truncate">{cluster.name}</span>
              <span className="text-xs text-muted-foreground ml-auto font-mono">
                {cluster.cellCount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
