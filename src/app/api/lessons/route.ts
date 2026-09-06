import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'lesson.json');

// Hàm bổ trợ: Đảm bảo thư mục src/data và file lesson.json luôn tồn tại
function ensureDataFileExists() {
  try {
    const dirPath = path.dirname(dataFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([]), 'utf-8');
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo thư mục/file dữ liệu:', error);
  }
}

// Đọc danh sách từ file JSON
function readLessonsFromFile(): any[] {
  try {
    ensureDataFileExists();
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      if (!fileContent.trim()) return [];

      const parsedData = JSON.parse(fileContent);

      if (Array.isArray(parsedData)) {
        return parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        return [parsedData];
      }
    }
  } catch (error) {
    console.error('Lỗi khi đọc file lesson.json:', error);
  }
  return [];
}

// Ghi danh sách vào file JSON
function writeLessonsToFile(lessons: any[]) {
  try {
    ensureDataFileExists();
    fs.writeFileSync(dataFilePath, JSON.stringify(lessons, null, 2), 'utf-8');
  } catch (error) {
    console.error('Lỗi khi ghi file lesson.json:', error);
  }
}

/**
 * GET: Tải danh sách bài giảng
 */
export async function GET() {
  try {
    const lessons = readLessonsFromFile();
    return NextResponse.json(
      { success: true, count: lessons.length, lessons: lessons },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Không thể đọc bài giảng từ hệ thống' },
      { status: 500 }
    );
  }
}

/**
 * POST: Lưu/Cập nhật bài giảng
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ (Thiếu tiêu đề bài giảng)' },
        { status: 400 }
      );
    }

    const currentLessons = readLessonsFromFile();
    const lessonId = body.id || `lesson_${Date.now()}`;

    const newLesson = {
      ...body,
      id: lessonId,
      title: body.title,
      grade: body.grade || '7',
      curriculum: body.curriculum || 'Chân trời sáng tạo',
      createdAt: body.createdAt || new Date().toLocaleDateString('vi-VN'),
      slides: body.slides || [],
    };

    // Xử lý ghi đè nếu bài giảng đã tồn tại (Upsert), nếu chưa thì thêm mới lên đầu
    const existingIndex = currentLessons.findIndex((item) => item.id === lessonId);
    if (existingIndex !== -1) {
      currentLessons[existingIndex] = newLesson;
    } else {
      currentLessons.unshift(newLesson);
    }

    writeLessonsToFile(currentLessons);

    return NextResponse.json(
      { success: true, message: 'Đã lưu bài giảng thành công', lesson: newLesson, lessons: currentLessons },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lưu bài giảng' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Xóa bài giảng theo ID hoặc Title
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const title = searchParams.get('title');

    if (!id && !title) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID hoặc Tiêu đề bài giảng cần xóa' },
        { status: 400 }
      );
    }

    let currentLessons = readLessonsFromFile();

    // Lọc bỏ bài giảng cần xóa theo id hoặc tiêu đề
    currentLessons = currentLessons.filter((item) => {
      if (id && item.id === id) return false;
      if (title && item.title === title) return false;
      return true;
    });

    writeLessonsToFile(currentLessons);

    return NextResponse.json(
      { success: true, message: 'Đã xóa bài giảng thành công', lessons: currentLessons },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa bài giảng' },
      { status: 500 }
    );
  }
}