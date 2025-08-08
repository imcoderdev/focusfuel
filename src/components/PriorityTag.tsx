"use client";

interface PriorityTagProps {
  priority: number | string;
}

export default function PriorityTag({ priority }: PriorityTagProps) {
  // Convert numeric priority to text and styles
  const getPriorityConfig = (priority: number | string) => {
    const numPriority = typeof priority === 'string' ? 
      (priority.toLowerCase() === 'high' ? 1 : priority.toLowerCase() === 'medium' ? 2 : priority.toLowerCase() === 'low' ? 3 : 2) :
      priority;

    const priorityMap = {
      1: { text: "High", classes: "bg-red-500/20 text-red-400 border-red-400/30" },
      2: { text: "Medium", classes: "bg-orange-500/20 text-orange-400 border-orange-400/30" },
      3: { text: "Low", classes: "bg-sky-500/20 text-sky-400 border-sky-400/30" }
    };

    return priorityMap[numPriority as keyof typeof priorityMap] || priorityMap[2]; // Default to Medium
  };

  const config = getPriorityConfig(priority);

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.text}
    </span>
  );
}
