import React from "react";
import { Info } from "lucide-react";
import { DatasetMetadata } from "@/types/singleCell";
import accelBioLogo from "@/assets/AccelBio_logo.png";

interface HeaderProps {
  metadata: DatasetMetadata;
}

export function Header({ metadata }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={accelBioLogo} 
              alt="AccelBio Logo" 
              className="h-12 w-auto"
            />
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {metadata.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Single-Cell RNA-seq Explorer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {metadata.cellCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Cells</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {metadata.geneCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Genes</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {metadata.clusterCount}
                </div>
                <div className="text-xs text-muted-foreground">Clusters</div>
              </div>
            </div>

            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Info className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}