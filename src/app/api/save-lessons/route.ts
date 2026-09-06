// src/app/api/save-lesson/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ⚠️ Luôn trả về NextResponse.json chứa object/array, không để trống
    return NextResponse.json({
      success: true,
      lessons: [
        { id: '1', title: 'Bài 5. Đo khối lượng', grade: '6' }
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    );
  }
}