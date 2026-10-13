import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { Collection } from '../types';
import { CollectionCard } from '../components/CollectionCard';

interface CollectionsPageProps {
  collections: Collection[];
  onSelectCollection: (col: Collection) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  collections,
  onSelectCollection,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#d4af37]" />
          Coleções Temáticas
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Conjuntos fotográficos com direção de arte consistente e iluminação calibrada
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {collections.map((col) => (
          <CollectionCard
            key={col.id}
            collection={col}
            variant="standard"
            onClick={() => onSelectCollection(col)}
          />
        ))}
      </div>
    </div>
  );
};
