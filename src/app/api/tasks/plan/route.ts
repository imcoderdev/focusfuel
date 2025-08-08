import { NextRequest, NextResponse } from 'next/server';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

interface PlanRequestBody {
  tasks: Task[];
}

// AI-powered task sorting algorithm
function optimizeTaskOrder(tasks: Task[]): Task[] {
  // Create a copy to avoid mutating the original array
  const tasksCopy = [...tasks];
  
  // Scoring system for task optimization
  const getTaskScore = (task: Task, index: number) => {
    let score = 0;
    
    // Priority scoring (Higher priority = higher score)
    switch (task.priority) {
      case 'High':
        score += 100;
        break;
      case 'Medium':
        score += 50;
        break;
      case 'Low':
        score += 25;
        break;
    }
    
    // Task complexity estimation based on text length
    const textLength = task.text.length;
    if (textLength > 80) {
      // Long tasks - schedule earlier when energy is high
      score += 30;
    } else if (textLength < 30) {
      // Quick tasks - can be scattered throughout
      score += 10;
    }
    
    // Keyword-based scoring for task types
    const text = task.text.toLowerCase();
    
    // Creative/strategic work (better in the morning)
    if (text.includes('design') || text.includes('plan') || text.includes('create') || 
        text.includes('write') || text.includes('strategy') || text.includes('research')) {
      score += 40;
    }
    
    // Admin/routine tasks (good for afternoon energy dips)
    if (text.includes('email') || text.includes('update') || text.includes('review') || 
        text.includes('organize') || text.includes('schedule') || text.includes('call')) {
      score -= 20;
    }
    
    // Technical/coding tasks (consistent energy needed)
    if (text.includes('code') || text.includes('debug') || text.includes('fix') || 
        text.includes('develop') || text.includes('build') || text.includes('implement')) {
      score += 25;
    }
    
    // Meeting/collaboration tasks (schedule based on availability)
    if (text.includes('meeting') || text.includes('discuss') || text.includes('present') || 
        text.includes('collaborate') || text.includes('sync')) {
      score += 15;
    }
    
    return score;
  };
  
  // Sort tasks based on the AI scoring system
  const sortedTasks = tasksCopy.sort((a, b) => {
    const scoreA = getTaskScore(a, tasksCopy.indexOf(a));
    const scoreB = getTaskScore(b, tasksCopy.indexOf(b));
    
    // Higher score = higher priority (should come first)
    return scoreB - scoreA;
  });
  
  return sortedTasks;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequestBody = await request.json();
    
    if (!body.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: 'Invalid request: tasks array is required' },
        { status: 400 }
      );
    }
    
    // Filter out completed tasks (they shouldn't be reordered)
    const incompleteTasks = body.tasks.filter(task => !task.completed);
    
    if (incompleteTasks.length === 0) {
      return NextResponse.json(
        { sortedTasks: [], message: 'No incomplete tasks to optimize' },
        { status: 200 }
      );
    }
    
    // Apply AI optimization
    const sortedTasks = optimizeTaskOrder(incompleteTasks);
    
    // Add a small delay to simulate AI processing (for better UX)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      sortedTasks,
      message: 'Tasks optimized successfully',
      optimization: {
        totalTasks: incompleteTasks.length,
        strategy: 'Priority-based with cognitive load optimization',
        factors: ['Priority level', 'Task complexity', 'Energy requirements', 'Task type']
      }
    });
    
  } catch (error) {
    console.error('Error in AI task planning:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
