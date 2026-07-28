import { create } from 'zustand';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  solution?: string;
  difficulty?: string;
  topic?: string;
  subTopic?: string;
}

export interface TestDetails {
  id?: string;
  name: string;
  type: string;
  subject: string;
  subjectName?: string;
  topics: string[];
  topicNames?: string[];
  sub_topics: string[];
  subTopicNames?: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: string;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status?: string;
}

interface TestStore {
  details: TestDetails | null;
  questions: Question[];
  testId: string | null;
  setDetails: (details: TestDetails) => void;
  setTestId: (id: string) => void;
  setQuestions: (qs: Question[]) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  clearTest: () => void;
}

export const useTestStore = create<TestStore>((set) => ({
  details: null,
  questions: [],
  testId: null,
  setDetails: (details) => set({ details }),
  setTestId: (id) => set({ testId: id }),
  setQuestions: (qs) => set({ questions: qs }),
  addQuestion: (q) => set((state) => ({ questions: [...state.questions, q] })),
  updateQuestion: (id, q) =>
    set((state) => ({
      questions: state.questions.map((existing) =>
        existing.id === id ? { ...existing, ...q } : existing
      ),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),
  clearTest: () => set({ details: null, questions: [], testId: null }),
}));
