'use client';

import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export interface Question {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer: number; // Chỉ số đáp án đúng (0, 1, 2, 3)
  explanation?: string;
}

interface McqQuizProps {
  questions: Question[];
  title?: string;
}

// Component phụ hiển thị công thức toán/lý/hóa bằng KaTeX an toàn
const MathText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Tách chuỗi để kiểm tra và hiển thị công thức $...$ hoặc $$...$$
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return <BlockMath key={index} math={math} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default function McqQuiz({ questions = [], title = 'Bài Tập Trắc Nghiệm' }: McqQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (questionId: number | string, optionIndex: number) => {
    if (showResults) return; // Không cho chọn lại sau khi đã nộp bài
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 italic">
        Chưa có câu hỏi trắc nghiệm nào cho bài học này.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 my-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
        {title}
      </h2>

      <div className="space-y-6">
        {questions.map((q, index) => {
          const isSelected = selectedAnswers[q.id] !== undefined;
          const userAnswer = selectedAnswers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="font-semibold text-gray-800 mb-3 text-lg">
                <span className="text-blue-600 font-bold mr-2">Câu {index + 1}:</span>
                <MathText content={q.question} />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  let buttonStyle = "bg-white hover:bg-blue-50 border-gray-300 text-gray-700";

                  if (showResults) {
                    if (optIdx === q.correctAnswer) {
                      buttonStyle = "bg-green-100 border-green-500 text-green-800 font-medium";
                    } else if (userAnswer === optIdx && !isCorrect) {
                      buttonStyle = "bg-red-100 border-red-500 text-red-800";
                    } else {
                      buttonStyle = "bg-gray-100 border-gray-200 text-gray-400 opacity-60";
                    }
                  } else if (userAnswer === optIdx) {
                    buttonStyle = "bg-blue-100 border-blue-500 text-blue-800 font-medium";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3 text-left rounded-md border transition-all duration-150 flex items-center ${buttonStyle}`}
                      disabled={showResults}
                    >
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mr-3 text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <MathText content={opt} />
                    </button>
                  );
                })}
              </div>

              {/* Hiển thị giải thích sau khi nộp bài */}
              {showResults && q.explanation && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-900 text-sm rounded">
                  <span className="font-bold">Giải thích: </span>
                  <MathText content={q.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Thanh kết quả và điều khiển */}
      <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
        {showResults ? (
          <>
            <div className="text-lg font-bold text-gray-800">
              Kết quả: <span className="text-blue-600">{calculateScore()}</span> / {questions.length} câu đúng
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
            >
              Làm lại
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg shadow transition"
          >
            Nộp bài
          </button>
        )}
      </div>
    </div>
  );
}