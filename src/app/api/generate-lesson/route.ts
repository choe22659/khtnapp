// src/app/api/generate-lesson/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { PHET_SIMULATIONS } from '@/lib/phet-data';

// Khởi tạo Gemini Client (Đảm bảo đã khai báo GEMINI_API_KEY trong file .env.local)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Định nghĩa JSON Schema bắt buộc AI tuân thủ tuyệt đối
const lessonResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tên bài học chuẩn chương trình' },
    grade: { type: Type.STRING, description: 'Khối lớp (6, 7, 8, hoặc 9)' },
    objectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Mục tiêu bài học (Yêu cầu cần đạt) về Kiến thức, Năng lực KHTN và Phẩm chất',
    },
    slides: {
      type: Type.ARRAY,
      description: 'Danh sách các slide trình chiếu theo tiến trình dạy học',
      items: {
        type: Type.OBJECT,
        properties: {
          slideNumber: { type: Type.INTEGER },
          type: {
            type: Type.STRING,
            enum: ['warmup', 'concept', 'lab', 'practice', 'application'],
            description: 'Phân loại hoạt động sư phạm của slide',
          },
          title: { type: Type.STRING, description: 'Tiêu đề slide' },
          content: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Các ý chính cô đọng, dễ hiểu cho học sinh',
          },
          interactiveQuestion: {
            type: Type.STRING,
            description: 'Câu hỏi gợi mở, kích thích tư duy phản biện hoặc thảo luận nhóm',
          },
          phetSimulationUrl: {
            type: Type.STRING,
            description: 'Link mô phỏng PhET tương ứng nếu có (hoặc chuỗi rỗng nếu không có)',
          },
        },
        required: ['slideNumber', 'type', 'title', 'content', 'interactiveQuestion'],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      description: 'Bộ thẻ ghi nhớ thuật ngữ/khái niệm cốt lõi',
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: 'Thuật ngữ / Khái niệm' },
          definition: { type: Type.STRING, description: 'Định nghĩa ngắn gọn, dễ nhớ' },
        },
        required: ['term', 'definition'],
      },
    },
    quiz: {
      type: Type.ARRAY,
      description: 'Bộ câu hỏi trắc nghiệm đánh giá năng lực',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'Nội dung câu hỏi' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Mảnh chứa đúng 4 lựa chọn [A, B, C, D]',
          },
          answer: {
            type: Type.INTEGER,
            description: 'Chỉ số của đáp án đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D)',
          },
          explanation: { type: Type.STRING, description: 'Giải thích chi tiết lý do chọn đáp án' },
        },
        required: ['question', 'options', 'answer', 'explanation'],
      },
    },
  },
  required: ['title', 'grade', 'objectives', 'slides', 'flashcards', 'quiz'],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Đọc đầy đủ các tham số cơ bản và các tham số mới bổ sung từ Frontend Form
    const { 
      topic, 
      grade, 
      bookSeries = 'Kết nối tri thức với cuộc sống', 
      studentLevel = 'Đại trà', 
      yccd = '', 
      integrations = [], 
      targetOutput, 
      userRequirements 
    } = body;

    if (!topic || !grade) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ Tên chủ đề/Bài học và Khối lớp.' },
        { status: 400 }
      );
    }

    // Biến đổi mảng tích hợp thành chuỗi mô tả để đưa vào Prompt
    const integrationsText = Array.isArray(integrations) && integrations.length > 0 
      ? integrations.join(', ') 
      : 'Tích hợp STEM, Thí nghiệm thực tiễn và Lịch sử khoa học';

    // 2. Xây dựng System Prompt khớp chính xác với thông số đầu vào
    const systemPrompt = `
Bạn là một Chuyên gia Phương pháp Dạy học môn Khoa học Tự nhiên (KHTN) cấp THCS, giàu kinh nghiệm biên soạn theo Chương trình GDPT 2018.

THÔNG TIN ĐẦU VÀO CỦA BÀI GIẢNG:
- Tên bài học / Chủ đề: "${topic}"
- Khối lớp: KHTN Lớp ${grade}
- Bộ sách giáo khoa chủ đạo: "${bookSeries}"
- Đối tượng / Trình độ học sinh: "${studentLevel}" (Hãy điều chỉnh độ khó của kiến thức, câu hỏi tương tác và bài tập trắc nghiệm phù hợp với trình độ này).
- Yêu cầu cần đạt (YCCĐ): ${yccd ? `"${yccd}"` : 'Bám sát chuẩn YCCĐ trong Chương trình GDPT 2018 môn KHTN cho bài học này.'}
- Các định hướng tích hợp bắt buộc: ${integrationsText}

TRIẾT LÝ VÀ PHƯƠNG PHÁP DẠY HỌC BẮT BUỘC:
1. **Tinh thần bộ sách ${bookSeries}**: Mọi kiến thức khoa học đều phải bắt nguồn từ hiện tượng thực tế cuộc sống và quay trở lại giải quyết vấn đề thực tiễn (Gần gũi, sinh động, giàu tính ứng dụng).
2. **Tiến trình dạy học phát triển năng lực (Công văn 5512)**:
   - **Mở đầu (Khởi động)**: Sử dụng câu hỏi tình huống thực tế, hiện tượng gián tiếp/bất ngờ để tạo mâu thuẫn nhận thức.
   - **Hình thành kiến thức mới**: Hướng dẫn học sinh quan sát, làm thí nghiệm, thảo luận để tự rút ra kết luận.
   - **Luyện tập**: Hệ thống hóa kiến thức qua câu hỏi tương tác và bài tập trắc nghiệm phân hóa theo đối tượng học sinh ${studentLevel}.
   - **Vận dụng**: Bài tập tình huống thực tế, gợi ý hoạt động STEM đơn giản (dùng vật liệu tái chế, đồ dùng dễ kiếm).

DANH SÁCH MÔ PHỎNG PHET KHẢ DỤNG:
Nếu bài học thuộc các chủ đề sau, hãy chèn chính xác URL PhET tương ứng vào trường 'phetSimulationUrl':
${JSON.stringify(PHET_SIMULATIONS, null, 2)}

${userRequirements ? `- Yêu cầu thêm từ giáo viên: ${userRequirements}` : ''}
`;

    // 3. Gọi Gemini API với cấu hình JSON Schema nghiêm ngặt
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `Hãy soạn bài giảng KHTN Lớp ${grade} chủ đề: "${topic}" theo bộ sách "${bookSeries}", trình độ học sinh "${studentLevel}".` 
            }
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: lessonResponseSchema,
        temperature: 0.3, // Giữ độ chính xác cao cho kiến thức khoa học
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('AI không phản hồi nội dung.');
    }

    // 4. Parse dữ liệu an toàn và trả về cho Client
    const lessonData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      data: lessonData,
    });
  } catch (error: any) {
    console.error('Lỗi khi khởi tạo bài giảng với AI:', error);
    return NextResponse.json(
      {
        error: 'Lỗi trong quá trình tạo bài giảng AI.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}