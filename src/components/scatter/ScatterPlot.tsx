import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Cell } from "@/types/singleCell";
import { getClusterColorRGBA } from "@/data/demoData";

interface ScatterPlotProps {
  cells: Cell[];
  expressionData?: Map<string, number>;
  selectedGene: string | null;
  pointSize: number;
  showClusters: boolean;
  showLabels: boolean;
  opacity: number;
  clusterNames: string[];
  onCellHover?: (cell: Cell | null) => void;
  onCellClick?: (cell: Cell) => void;
}

// Color scale for expression (blue to red through white)
function expressionToColor(value: number, min: number, max: number): [number, number, number, number] {
  const normalized = max === min ? 0.5 : (value - min) / (max - min);
  
  if (normalized < 0.5) {
    // Low expression: gray to white
    const t = normalized * 2;
    const gray = Math.round(180 + t * 75);
    return [gray, gray, gray, 255];
  } else {
    // High expression: white to red
    const t = (normalized - 0.5) * 2;
    const r = 255;
    const g = Math.round(255 - t * 180);
    const b = Math.round(255 - t * 200);
    return [r, g, b, 255];
  }
}

export function ScatterPlot({
  cells,
  expressionData,
  selectedGene,
  pointSize,
  showClusters,
  showLabels,
  opacity,
  clusterNames,
  onCellHover,
  onCellClick,
}: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

  // Calculate data bounds
  const bounds = useMemo(() => {
    if (cells.length === 0) return { minX: -50, maxX: 50, minY: -50, maxY: 50 };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    cells.forEach(cell => {
      if (cell.x < minX) minX = cell.x;
      if (cell.x > maxX) maxX = cell.x;
      if (cell.y < minY) minY = cell.y;
      if (cell.y > maxY) maxY = cell.y;
    });
    
    const padding = 0.1;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    return {
      minX: minX - rangeX * padding,
      maxX: maxX + rangeX * padding,
      minY: minY - rangeY * padding,
      maxY: maxY + rangeY * padding,
    };
  }, [cells]);

  // Expression bounds
  const expressionBounds = useMemo(() => {
    if (!expressionData || expressionData.size === 0) return { min: 0, max: 1 };
    
    let min = Infinity, max = -Infinity;
    expressionData.forEach(value => {
      if (value < min) min = value;
      if (value > max) max = value;
    });
    
    return { min, max };
  }, [expressionData]);

  // Cluster centers for labels
  const clusterCenters = useMemo(() => {
    const centers: Record<number, { x: number; y: number; count: number }> = {};
    
    cells.forEach(cell => {
      if (!centers[cell.cluster]) {
        centers[cell.cluster] = { x: 0, y: 0, count: 0 };
      }
      centers[cell.cluster].x += cell.x;
      centers[cell.cluster].y += cell.y;
      centers[cell.cluster].count++;
    });
    
    Object.keys(centers).forEach(key => {
      const k = parseInt(key);
      centers[k].x /= centers[k].count;
      centers[k].y /= centers[k].count;
    });
    
    return centers;
  }, [cells]);

  // Convert data coordinates to canvas coordinates
  const dataToCanvas = useCallback((x: number, y: number) => {
    const { width, height } = dimensions;
    const padding = 50;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    
    const scaleX = plotWidth / (bounds.maxX - bounds.minX);
    const scaleY = plotHeight / (bounds.maxY - bounds.minY);
    
    const canvasX = padding + (x - bounds.minX) * scaleX;
    const canvasY = height - padding - (y - bounds.minY) * scaleY;
    
    // Apply transform
    return {
      x: (canvasX - width / 2) * transform.scale + width / 2 + transform.x,
      y: (canvasY - height / 2) * transform.scale + height / 2 + transform.y,
    };
  }, [dimensions, bounds, transform]);

  // Draw the plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    const gridSpacing = 20;
    const { minX, maxX, minY, maxY } = bounds;
    
    for (let x = Math.ceil(minX / gridSpacing) * gridSpacing; x <= maxX; x += gridSpacing) {
      const start = dataToCanvas(x, minY);
      const end = dataToCanvas(x, maxY);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    
    for (let y = Math.ceil(minY / gridSpacing) * gridSpacing; y <= maxY; y += gridSpacing) {
      const start = dataToCanvas(minX, y);
      const end = dataToCanvas(maxX, y);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    
    // Draw cells
    const scaledPointSize = pointSize * transform.scale;
    
    cells.forEach(cell => {
      const pos = dataToCanvas(cell.x, cell.y);
      
      // Skip if outside viewport
      if (pos.x < -10 || pos.x > dimensions.width + 10 ||
          pos.y < -10 || pos.y > dimensions.height + 10) {
        return;
      }
      
      let color: [number, number, number, number];
      
      if (selectedGene && expressionData) {
        const expr = expressionData.get(cell.id) ?? 0;
        color = expressionToColor(expr, expressionBounds.min, expressionBounds.max);
      } else if (showClusters) {
        color = getClusterColorRGBA(cell.cluster, opacity);
      } else {
        color = [100, 140, 200, Math.floor(opacity * 255)];
      }
      
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, scaledPointSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw cluster labels - show even when gene expression is displayed
    if (showLabels) {
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      Object.entries(clusterCenters).forEach(([clusterId, center]) => {
        const id = parseInt(clusterId);
        const pos = dataToCanvas(center.x, center.y);
        
        // Draw label background with higher opacity when expression is shown
        const bgOpacity = selectedGene ? 0.95 : 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${bgOpacity})`;
        ctx.strokeStyle = selectedGene ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = selectedGene ? 1.5 : 1;
        
        const labelText = id.toString();
        const metrics = ctx.measureText(labelText);
        const padding = 6;
        const boxWidth = metrics.width + padding * 2;
        const boxHeight = 20;
        
        ctx.beginPath();
        ctx.roundRect(pos.x - boxWidth / 2, pos.y - boxHeight / 2, boxWidth, boxHeight, 4);
        ctx.fill();
        ctx.stroke();
        
        // Draw label text
        ctx.fillStyle = "#1f2937";
        ctx.fillText(labelText, pos.x, pos.y);
      });
    }
    
    // Draw axes labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("tSNE1", dimensions.width / 2, dimensions.height - 10);
    
    ctx.save();
    ctx.translate(15, dimensions.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("tSNE2", 0, 0);
    ctx.restore();
    
  }, [cells, expressionData, selectedGene, pointSize, showClusters, showLabels, opacity, dimensions, bounds, expressionBounds, clusterCenters, transform, dataToCanvas]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: Math.max(300, width), height: Math.max(300, height) });
      }
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Mouse handlers for pan/zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(10, prev.scale * delta)),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[400px] bg-card rounded-lg overflow-hidden border border-border"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(10, prev.scale * 1.2) }))}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }))}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          −
        </button>
        <button
          onClick={handleDoubleClick}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors text-xs"
          title="Reset view"
        >
          ⌂
        </button>
      </div>
      
      {/* Expression legend */}
      {selectedGene && (
        <div className="absolute top-4 right-4 bg-card/95 border border-border rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-foreground mb-2">{selectedGene}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="w-24 h-3 rounded gradient-expression" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      )}
    </div>
  );
}
