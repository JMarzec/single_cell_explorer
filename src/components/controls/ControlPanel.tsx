import React from "react";
import { GeneSearch } from "./GeneSearch";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        <h3 className="text-sm font-semibold text-foreground mb-3">Gene Expression</h3>
        <GeneSearch
          genes={genes}
          selectedGene={settings.selectedGene}
          onGeneSelect={(gene) => onSettingsChange({ selectedGene: gene })}
        />
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
