// src/types/lesson.ts

// 1. Cấu trúc câu hỏi trắc nghiệm
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

// 2. Cấu trúc dữ liệu cho Sơ đồ tư duy (Mindmap)
export interface MindmapNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

// 3. Cấu trúc từng Slide bài giảng
export interface Slide {
  slideNumber: number;
  title: string;
  contentType: 'theory' | 'experiment' | 'mindmap' | 'quiz' | 'stem';
  content: string;
  teacherNotes: string; // Lời thoại/gợi ý giảng dạy cho GV
  visualSuggestion: string; // Gợi ý hình ảnh/video/mô phỏng
  simulationUrl?: string | null; // URL nhúng thí nghiệm/mô phỏng
  embedUrl?: string | null;
  embedHtml?: string | null;
  quiz?: QuizQuestion;
}

// 4. Cấu trúc tổng thể của Bài học (Lesson)
export interface LessonData {
  id?: string; // ID duy nhất của bài học
  title: string;
  grade: number | string;
  subject: string; // Lý, Hóa, Sinh
  bookSeries: string;
  curriculum?: string;
  createdAt?: string;
  objectives: string[];
  slides: Slide[];
  // Bổ sung Mindmap vào cấp độ bài học (hoặc có thể chứa ở từng slide)
  mindmap?: MindmapData;
}