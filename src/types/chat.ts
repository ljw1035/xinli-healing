export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string; // used for role: 'tool'
  tool_call_id?: string; // used for role: 'tool'
  tool_calls?: ToolCall[];
  
  // Custom states for UI rendering
  isCrisis?: boolean; // If matched safety self-harm/suicidal detection
  toolExecuted?: boolean; // Whether the user completed interaction on this tool widget
  toolResultData?: any; // The raw data returned by the tool interaction
  isStreaming?: boolean;  // Whether this message is currently being streamed
  
  // 量化评估：前后情绪自评
  sessionScore?: {
    stage: 'before' | 'after';
    score: number; // 1-10
    label: string;
    timestamp: number;
  };
}

export interface BreathingToolArgs {
  tool_name: 'breathing_training' | 'mindfulness_meditation' | 'muscle_relaxation' | 'sleep_relaxation';
  method: string;
  duration: string;
  steps: string[];
  expected_effect: string;
}

export interface ActToolArgs {
  painful_feeling: string;
  underlying_value: string;
  acceptance_sentence: string;
  committed_action: string;
}

export interface SfbtToolArgs {
  exception: string;
  resource: string;
  small_goal: string;
  confidence_score: number;
}

// ====== 新增：GAD-7 焦虑评估工具 ======
export interface Gad7Question {
  id: number;
  text: string;
  options: { score: number; label: string }[];
}

export interface Gad7ToolArgs {
  tool_name: 'gad7_assessment';
  introduction: string;
  instruction: string;
}

// ====== 新增：CBT 认知重构工具 ======
export interface CbtToolArgs {
  situation: string;
  automatic_thought: string;
  emotion_and_intensity: string;
  cognitive_distortion: string;
}

// ====== 新增：情绪日记工具 ======
export interface EmotionDiaryArgs {
  prompt: string;
  suggested_emotions: string[];
}

// ====== 新增：情绪自评温度计 ======
export interface SelfRatingArgs {
  prompt: string;
  min_label: string;
  max_label: string;
  current_estimated?: number;
}
