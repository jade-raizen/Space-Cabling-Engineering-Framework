import React from 'react';
import { useStore } from '../store/useStore';
import { View3DInteractive } from './viewports/View3DInteractive';
import { View2DGrid } from './viewports/View2DGrid';
import { WorkspaceTools } from '../components/layout/WorkspaceTools';
import { AnalysisCompliance } from '../components/layout/AnalysisCompliance';
import { TopRibbon } from '../components/layout/TopRibbon';
import { Menu } from 'lucide-react';

export const Dashboard = () => {
  const { activeView } = useStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden font-sans text-slate-900">
      {/* Header */}
      <header className="h-12 bg-white border-b border-gray-300 flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-slate-800 rounded text-white">
            <Menu size={16} />
          </div>
          <h1 className="font-semibold text-sm text-slate-800 tracking-tight">
            Space Cabling Engineering Framework - v0.5.0-Beta (AI Routing & EMC Compliance)
          </h1>
        </div>
        <div className="flex items-center gap-4">
           {/* Window controls simulation */}
           <div className="flex gap-2">
             <div className="w-3 h-3 rounded-full bg-slate-300"></div>
             <div className="w-3 h-3 rounded-full bg-slate-300"></div>
             <div className="w-3 h-3 rounded-full bg-slate-300"></div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Workspace Tools */}
        <WorkspaceTools />

        {/* Center Panel: Viewport */}
        <main className="flex-1 relative bg-white border-x border-gray-300 flex flex-col">
          {/* Top Ribbon for Object Properties */}
          <TopRibbon />

          {/* Viewport Content */}
          <div className="flex-1 relative">
            {activeView === 'editor-2d' ? (
              <div className="h-full relative">
                <div className="absolute top-2 left-2 z-10 bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm pointer-events-none">
                  GLOBAL VIEW (2D)
                </div>
                <View2DGrid />
              </div>
            ) : (
              <div className="h-full relative">
                <div className="absolute top-2 left-2 z-10 bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm pointer-events-none">
                  3D INTERACTIVE VIEW
                </div>
                <View3DInteractive />
              </div>
            )}
          </div>
        </main>

        {/* Right Panel: Analysis & Compliance */}
        <AnalysisCompliance />

      </div>
    </div>
  );
};
