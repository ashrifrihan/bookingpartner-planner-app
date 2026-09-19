'use client';

import { usePlanner } from '@/context/PlannerContext';
import { DeveloperMemorySection } from '@/components/DeveloperMemory';

export default function MemoryPage() {
  const { memoryNotes, addMemoryNote, deleteMemoryNote } = usePlanner();

  return (
    <div className="memory-view">
      <DeveloperMemorySection
        memoryNotes={memoryNotes}
        onAddNote={addMemoryNote}
        onDeleteNote={deleteMemoryNote}
      />
    </div>
  );
}
