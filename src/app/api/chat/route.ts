import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: 'Chưa cấu hình GEMINI_API_KEY trong file .env.local!' },
        { status: 500 }
      );
    }

    const { message, lessonTitle } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Cập nhật model mới nhất: gemini-3.6-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: `Bạn là trợ lý AI dạy môn Khoa học Tự nhiên cấp THCS. 
Hãy trả lời ngắn gọn (3-4 câu), dễ hiểu đối với học sinh, có giọng văn thân thiện và động viên.
${lessonTitle ? `Bài học hiện tại: ${lessonTitle}` : ''}`,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error: any) {
    console.error('Lỗi Gemini API:', error);
    return NextResponse.json(
      { reply: `Lỗi AI: ${error?.message || 'Không thể kết nối Gemini'}` },
      { status: 500 }
    );
  }
}