'use client';

import { usePlanner } from '@/context/PlannerContext';
import { AiPurposeAssistant } from '@/components/AiPurposeAssistant';

export default function AiPage() {
  const {
    todayPlan,
    today,
    yesterdayIncompleteTasks,
    overdueCount,
    overallPercent,
    memoryNotes,
    blocked,
    setInspectTask,
  } = usePlanner();

  return (
    <div className="ai-view">
      <AiPurposeAssistant
        todayPlan={todayPlan}
        todayDate={today}
        missedTasksCount={yesterdayIncompleteTasks.length}
        missedTasksList={yesterdayIncompleteTasks.map((t) => t.item)}
        overdueCount={overdueCount}
        overallPercent={overallPercent}
        memoryNotes={memoryNotes}
        activeBlocker={blocked[today]}
        onOpenTaskModal={() => todayPlan && setInspectTask({ day: todayPlan, itemIndex: 0 })}
      />
    </div>
  );
}
