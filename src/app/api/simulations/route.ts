import { NextResponse } from 'next/server';

// Định nghĩa kiểu dữ liệu
export interface CustomSimulation {
  id: string;
  title: string;
  subject: string;
  embedUrl: string;
  createdAt: string;
}

export interface LessonData {
  id: string;
  title: string;
  grade: string;
  curriculum: string;
  createdAt: string;
  teacherNote?: string;
  slides: any[];
}

// Lưu trữ dữ liệu trong bộ nhớ Server (Tạm thời)
// Lưu ý: Nếu muốn lưu trữ vĩnh viễn khi restart server, bạn có thể kết nối Supabase, MongoDB hoặc Firebase tại đây.
let globalSimulations: CustomSimulation[] = [
  {
    id: 'sim_1',
    title: 'Mô Phỏng Cấu Tạo Nguyên Tử (PhET)',
    subject: 'Hóa Học',
    embedUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  },
  {
    id: 'sim_2',
    title: 'Chuyển Động & Lực (PhET)',
    subject: 'Vật Lý',
    embedUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  },
  {
    "id": "1788674563918",
    "title": "KHTN 9 - Bài 1",
    "subject": "Khác",
    "embedUrl": "https://dreadful-indigo-sirdtpp6.edgeone.dev/",
    "createdAt": new Date().toLocaleDateString('vi-VN'),
  }, 
  {
    "id": "1788674637838",
    "title": "KHTN 9 - BÀI 3",
    "subject": "Vật Lý",
    "embedUrl": "https://khtn9-bai3-dpqmdcd57jr6.edgeone.dev/",
    "createdAt": new Date().toLocaleDateString('vi-VN'),
  },
];

let globalLessons: LessonData[] = [];

// Lấy toàn bộ dữ liệu (Dành cho trang học sinh & giáo viên)
export async function GET() {
  return NextResponse.json({
    simulations: globalSimulations,
    lessons: globalLessons,
  });
}

// Thêm hoặc xóa dữ liệu từ Trang Giáo Viên
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'ADD_SIMULATION') {
      globalSimulations = [payload, ...globalSimulations];
    } else if (action === 'DELETE_SIMULATION') {
      globalSimulations = globalSimulations.filter((s) => s.id !== payload.id);
    } else if (action === 'ADD_LESSON') {
      globalLessons = [payload, ...globalLessons];
    } else if (action === 'DELETE_LESSON') {
      globalLessons = globalLessons.filter((l) => l.id !== payload.id);
    }

    return NextResponse.json({
      success: true,
      simulations: globalSimulations,
      lessons: globalLessons,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Lỗi xử lý API' }, { status: 500 });
  }
}