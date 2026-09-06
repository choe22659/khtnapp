'use client';

import React, { useState, useEffect } from 'react';
import { LessonData, Slide } from '@/types/lesson';
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, Edit3, Save, Download, FileText, Check, XCircle, CheckCircle } from 'lucide-react';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';

interface SlideViewerProps {
  initialLessonData: LessonData;
}

export default function SlideViewer({ initialLessonData }: SlideViewerProps) {
  const [lessonData, setLessonData] = useState<LessonData>(initialLessonData);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State quản lý tương tác Quiz
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentSlide: Slide = lessonData.slides[currentIndex];

  useEffect(() => {
    setSelectedAnswer(null);
  }, [currentIndex]);

  // Hàm chuẩn hóa chuỗi để so sánh đáp án chính xác
  const normalizeText = (text: string) => text.trim().toLowerCase();

  // Kiểm tra đáp án được chọn có đúng hay không
  const checkIsCorrect = (option: string, answer: string) => {
    const optClean = normalizeText(option);
    const ansClean = normalizeText(answer);
    return optClean === ansClean || optClean.endsWith(ansClean) || ansClean.endsWith(optClean);
  };

  const handleUpdateSlide = (field: keyof Slide, value: any) => {
    const updatedSlides = [...lessonData.slides];
    updatedSlides[currentIndex] = {
      ...updatedSlides[currentIndex],
      [field]: value,
    };
    setLessonData({ ...lessonData, slides: updatedSlides });
  };

  const handleExportWord = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${lessonData.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; }
          h1 { font-size: 18pt; text-align: center; color: #1a365d; }
          h2 { font-size: 14pt; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; }
          .slide-box { border: 1px solid #cbd5e0; padding: 12px; margin-bottom: 16px; }
          .teacher-note { background-color: #f7fafc; border-left: 4px solid #3182ce; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>KẾ HOẠCH BÀI DẠY: ${lessonData.title.toUpperCase()}</h1>
        <p><b>Môn:</b> KHTN Lớp ${lessonData.grade} (${lessonData.subject}) - <b>Sách:</b> ${lessonData.bookSeries}</p>
        <p><b>Mục tiêu:</b> ${lessonData.objectives?.join('; ')}</p>
        <hr/>
        ${lessonData.slides.map((s) => `
          <div class="slide-box">
            <h3>Slide ${s.slideNumber}: ${s.title}</h3>
            <p>${s.content.replace(/\n/g, '<br/>')}</p>
            ${s.quiz ? `<p><b>Câu hỏi:</b> ${s.quiz.question}</p><p><b>Đáp án đúng:</b> ${s.quiz.answer}</p>` : ''}
            <div class="teacher-note"><b>Hướng dẫn GV:</b> ${s.teacherNotes || ''}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    const blob = await asBlob(htmlContent);
    saveAs(blob as Blob, `GiaoAn_KHTN_${lessonData.grade}_${lessonData.title.replace(/\s+/g, '_')}.docx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
      {/* THANH ĐIỀU KHIỂN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1b4b', color: '#fff', padding: '14px 20px', borderRadius: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{lessonData.title}</h3>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            KHTN Lớp {lessonData.grade} | Sách: {lessonData.bookSeries} ({lessonData.subject})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: isEditing ? '#22c55e' : '#fff', color: isEditing ? '#fff' : '#1e1b4b',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {isEditing ? <><Check size={16} /> Lưu bài giảng</> : <><Edit3 size={16} /> Chỉnh sửa Slide</>}
          </button>

          <button
            onClick={handleExportWord}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            <Download size={16} /> Xuất Word
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showNotes ? '2.5fr 1fr' : '1fr', gap: '20px' }}>
        {/* KHUNG KHUNG HIỂN THỊ SLIDE */}
        <div style={{
          background: '#ffffff',
          border: isEditing ? '2px dashed #2563eb' : '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
         
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '14px', textTransform: 'uppercase' }}>
                Slide {currentSlide.slideNumber} / {lessonData.slides.length} • {currentSlide.contentType}
              </span>
            </div>

            {/* TIÊU ĐỀ SLIDE */}
            {isEditing ? (
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                style={{ width: '100%', fontSize: '20px', fontWeight: 'bold', padding: '8px', marginBottom: '16px', border: '1px solid #93c5fd', borderRadius: '4px' }}
              />
            ) : (
              <h2 style={{ fontSize: '24px', color: '#111827', marginTop: '8px', marginBottom: '16px' }}>
                {currentSlide.title}
              </h2>
            )}

            {/* NỘI DUNG LÝ THUYẾT HOẶC CÂU HỎI TƯƠNG TÁC */}
            {currentSlide.contentType !== 'quiz' ? (
              isEditing ? (
                <textarea
                  rows={8}
                  value={currentSlide.content}
                  onChange={(e) => handleUpdateSlide('content', e.target.value)}
                  style={{ width: '100%', fontSize: '16px', padding: '10px', lineHeight: '1.5', border: '1px solid #93c5fd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ fontSize: '18px', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-line' }}>
                  {currentSlide.content}
                </div>
              )
            ) : (
              /* DẠNG SLIDE TƯƠNG TÁC (QUIZ) - ĐÃ SỬA LỖI ĐÁP ÁN ĐÚNG/SAI */
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                  ❓ {currentSlide.quiz?.question}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentSlide.quiz?.options.map((opt, idx) => {
                    const isCorrectAnswer = checkIsCorrect(opt, currentSlide.quiz?.answer || '');
                    const isSelected = selectedAnswer === opt;

                    let btnStyle = {
                      background: '#ffffff',
                      borderColor: '#d1d5db',
                      color: '#1f2937',
                      icon: null as any
                    };

                    // Nếu người dùng đã click chọn
                    if (selectedAnswer) {
                      if (isCorrectAnswer) {
                        btnStyle = {
                          background: '#d1fae5', // Màu xanh
                          borderColor: '#10b981',
                          color: '#065f46',
                          icon: <CheckCircle size={20} color="#10b981" />
                        };
                      } else if (isSelected) {
                        btnStyle = {
                          background: '#fee2e2', // Màu đỏ khi chọn sai
                          borderColor: '#ef4444',
                          color: '#991b1b',
                          icon: <XCircle size={20} color="#ef4444" />
                        };
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedAnswer(opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          padding: '14px 18px',
                          borderRadius: '8px',
                          border: `2px solid ${btnStyle.borderColor}`,
                          background: btnStyle.background,
                          color: btnStyle.color,
                          fontSize: '16px',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>{opt}</span>
                        {btnStyle.icon}
                      </button>
                    );
                  })}
                </div>

                {/* THÔNG BÁO KẾT QUẢ VÀ GIẢI THÍCH */}
                {selectedAnswer && (
                  <div style={{
                    marginTop: '20px', padding: '14px', borderRadius: '8px',
                    background: checkIsCorrect(selectedAnswer, currentSlide.quiz?.answer || '') ? '#ecfdf5' : '#fff1f2',
                    borderLeft: `5px solid ${checkIsCorrect(selectedAnswer, currentSlide.quiz?.answer || '') ? '#10b981' : '#f43f5e'}`
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: checkIsCorrect(selectedAnswer, currentSlide.quiz?.answer || '') ? '#047857' : '#be123c' }}>
                      {checkIsCorrect(selectedAnswer, currentSlide.quiz?.answer || '') ? '🎉 Chính xác!' : '❌ Chưa chính xác!'}
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#374151' }}>
                      <strong>Giải thích:</strong> {currentSlide.quiz?.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ĐIỀU HƯỚNG SLIDE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                background: currentIndex === 0 ? '#f3f4f6' : '#2563eb',
                color: currentIndex === 0 ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: '6px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={18} /> Slide trước
            </button>

            <span style={{ fontWeight: 'bold', color: '#6b7280' }}>
              {currentIndex + 1} / {lessonData.slides.length}
            </span>

            <button
              disabled={currentIndex === lessonData.slides.length - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                background: currentIndex === lessonData.slides.length - 1 ? '#f3f4f6' : '#2563eb',
                color: currentIndex === lessonData.slides.length - 1 ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: '6px', cursor: currentIndex === lessonData.slides.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Slide tiếp <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* LỜI THOẠI HƯỚNG DẪN GIÁO VIÊN */}
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#2563eb" /> Lời thoại / Hướng dẫn GV
          </h4>
          <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            {currentSlide.teacherNotes || 'Chưa có ghi chú cho slide này.'}
          </div>
        </div>
      </div>
    </div>
  );
}