'use client';
import { useState } from 'react';
import MathView from './MathView';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface McqQuizProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Hàm hỗ trợ tách văn bản có chứa $công_thức$ để render KaTeX
function RenderTextWithMath({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return <MathView key={index} math={part.slice(1, -1)} block={false} />;
        }
        return part;
      })}
    </span>
  );
}

export default function McqQuiz({ question, options, correctAnswer, explanation }: McqQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index: number) => {
    if (submitted) return;
    setSelected(index);
  };

  const handleCheck = () => {
    if (selected !== null) setSubmitted(true);
  };

  const handleReset = () => {
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Câu hỏi */}
      <div className="text-xl md:text-2xl font-semibold text-slate-100 flex items-start gap-3">
        <HelpCircle className="w-7 h-7 text-amber-400 shrink-0 mt-1" />
        <div>
          <RenderTextWithMath text={question} />
        </div>
      </div>

      {/* Danh sách 4 đáp án */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt, idx) => {
          let btnStyle = "bg-slate-900/80 border-slate-700 text-slate-200 hover:border-blue-500 hover:bg-slate-800";
          
          if (selected === idx) {
            btnStyle = "bg-blue-600/30 border-blue-500 text-white font-medium";
          }

          if (submitted) {
            if (idx === correctAnswer) {
              btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold";
            } else if (selected === idx && idx !== correctAnswer) {
              btnStyle = "bg-rose-600/30 border-rose-500 text-rose-200";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`p-4 rounded-xl border-2 text-left text-lg transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>
                <RenderTextWithMath text={opt} />
              </span>

              {submitted && idx === correctAnswer && (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              {submitted && selected === idx && idx !== correctAnswer && (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Nút nộp bài / Làm lại / Giải thích */}
      <div className="flex items-center justify-between mt-2">
        {!submitted ? (
          <button
            onClick={handleCheck}
            disabled={selected === null}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold rounded-xl transition"
          >
            Kiểm tra đáp án
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition text-sm font-medium"
          >
            🔄 Thử lại
          </button>
        )}

        {/* Thông báo Giải thích (Đã được cập nhật bọc qua RenderTextWithMath) */}
        {submitted && explanation && (
          <div className={`p-4 rounded-xl border text-sm md:text-base flex-1 ml-4 ${
            selected === correctAnswer 
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}>
            <span className="font-bold">
              {selected === correctAnswer ? "🎉 Chính xác! " : "❌ Chưa đúng. "}
            </span>
            <RenderTextWithMath text={explanation} />
          </div>
        )}
      </div>
    </div>
  );
}