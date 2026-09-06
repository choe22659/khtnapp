import pptxgen from 'pptxgenjs';

export const exportLessonToPptx = (lessonData: any) => {
  if (!lessonData || !lessonData.slides) return;

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Slide Tiêu đề bài giảng
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0F172A' }; // Dark slate background
  titleSlide.addText(lessonData.title || 'Bài giảng KHTN', {
    x: 0.8,
    y: 2.2,
    w: 8.4,
    h: 1.8,
    fontSize: 32,
    bold: true,
    color: '38BDF8',
    align: 'center',
  });

  // Duyệt từng slide
  lessonData.slides.forEach((slide: any, index: number) => {
    const s = pptx.addSlide();

    // Tiêu đề Slide
    s.addText(`Slide ${index + 1}: ${slide.title}`, {
      x: 0.5,
      y: 0.4,
      w: 9.0,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: '1E293B',
    });

    if (slide.type === 'content') {
      let contentText = slide.content || '';
      if (slide.formula) contentText += `\n\n[Công thức]: ${slide.formula}`;
      if (slide.note) contentText += `\n\n[Lưu ý]: ${slide.note}`;

      s.addText(contentText, {
        x: 0.5,
        y: 1.2,
        w: 9.0,
        h: 5.0,
        fontSize: 16,
        color: '334155',
        lineSpacing: 24,
      });
    } else if (slide.type === 'quiz_mcq') {
      s.addText(`Câu hỏi: ${slide.question}`, {
        x: 0.5,
        y: 1.2,
        w: 9.0,
        h: 1.0,
        fontSize: 16,
        bold: true,
        color: '0F172A',
      });

      const optionsText = slide.options?.join('\n') || '';
      s.addText(optionsText, {
        x: 0.8,
        y: 2.4,
        w: 8.4,
        h: 3.0,
        fontSize: 15,
        color: '2563EB',
        lineSpacing: 28,
      });

      if (slide.explanation) {
        s.addText(`💡 Giải thích: ${slide.explanation}`, {
          x: 0.5,
          y: 5.8,
          w: 9.0,
          h: 0.8,
          fontSize: 13,
          color: 'D97706',
          italic: true,
        });
      }
    } else if (slide.type === 'flashcard') {
      s.addText(`❓ ${slide.question}`, {
        x: 0.5,
        y: 1.8,
        w: 9.0,
        h: 1.2,
        fontSize: 18,
        bold: true,
        color: '047857',
        align: 'center',
      });

      s.addText(`💡 Đáp án: ${slide.answer}`, {
        x: 0.5,
        y: 3.5,
        w: 9.0,
        h: 1.5,
        fontSize: 16,
        color: '1E293B',
        align: 'center',
      });
    }
  });

  // Tải file xuống
  const fileName = `${(lessonData.title || 'Bai_giang_KHTN').replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
  pptx.writeFile({ fileName });
};