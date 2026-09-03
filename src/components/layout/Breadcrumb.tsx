import React from 'react';
import { ChevronRight, Folder, Home } from 'lucide-react';
import { FolderBreadcrumbItem } from '../../hooks/useFolders';

interface BreadcrumbProps {
  items: FolderBreadcrumbItem[];
  onSelectFolder: (folderId: string | null) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onSelectFolder }) => {
  return (
    <nav className="flex items-center overflow-x-auto py-2 text-xs font-medium text-slate-500 whitespace-nowrap no-scrollbar">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id ?? 'root'} className="flex items-center">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />}
            <button
              onClick={() => onSelectFolder(item.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                isLast
                  ? 'font-bold text-indigo-700 bg-indigo-50/70 pointer-events-none'
                  : 'hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              {index === 0 ? (
                <Home className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              ) : (
                <Folder className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
              )}
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{item.name}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
};
