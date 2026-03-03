import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Terminal } from 'lucide-react';

export const Console = () => {
  const { logs } = useStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-48 bg-black border-t border-slate-700 flex flex-col font-mono text-xs">
      <div className="flex items-center px-4 py-1 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
        <Terminal size={12} className="mr-2" />
        <span>System Log</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-slate-900/50 p-0.5 rounded">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={`font-bold shrink-0 w-24 ${
              log.source === 'Compliance' ? 'text-purple-400' :
              log.source === 'Routing' ? 'text-blue-400' :
              log.source === 'Thermal' ? 'text-orange-400' : 'text-slate-400'
            }`}>
              [{log.source}]
            </span>
            <span className={`break-all ${
              log.level === 'error' ? 'text-red-500' :
              log.level === 'warning' ? 'text-amber-500' :
              log.level === 'success' ? 'text-emerald-500' : 'text-slate-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
