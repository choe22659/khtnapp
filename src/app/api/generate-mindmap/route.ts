import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

// Định nghĩa JSON Schema đầu ra cho Gemini để đảm bảo trả về đúng cấu trúc Node/Edge
const mindmapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: 'Danh sách các nút (nodes) trong sơ đồ tư duy',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'ID duy nhất của node, ví dụ: root, node_1, node_2' },
          data: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: 'Tên hoặc nội dung ngắn gọn của nút (dưới 10 từ)' },
            },
            required: ['label'],
          },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: 'Tọa độ X trên bản đồ (VD: root = 250, nhánh 1 = 500, v.v.)' },
              y: { type: Type.NUMBER, description: 'Tọa độ Y trên bản đồ' },
            },
            required: ['x', 'y'],
          },
        },
        required: ['id', 'data', 'position'],
      },
    },
    edges: {
      type: Type.ARRAY,
      description: 'Danh sách các đường nối (edges) giữa các nút',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'ID đường nối, ví dụ: e_root_node_1' },
          source: { type: Type.STRING, description: 'ID nút nguồn (node cha)' },
          target: { type: Type.STRING, description: 'ID nút đích (node con)' },
          animated: { type: Type.BOOLEAN, description: 'Bật hiệu ứng chuyển động cho đường nối (luôn true)' },
        },
        required: ['id', 'source', 'target'],
      },
    },
  },
  required: ['nodes', 'edges'],
};

export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nội dung bài học.' },
        { status: 400 }
      );
    }

    // Khởi tạo Gemini Client với API Key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      Bạn là một chuyên gia giáo dục. Hãy phân tích nội dung bài học dưới đây và thiết kế một sơ đồ tư duy (Mindmap) logic, ngắn gọn, trực quan.

      Tiêu đề bài học: ${title || 'Chủ đề chính'}
      Nội dung bài học:
      """
      ${content}
      """

      Quy tắc tạo sơ đồ:
      1. Nút gốc (root) có id="root", label là tiêu đề bài học hoặc tên chủ đề chính, đặt tại position: { x: 250, y: 250 }.
      2. Tách bài học thành 3-5 nhánh chính (Cấp 1), nằm bên phải nút gốc (x khoảng 500 đến 550, y xếp dọc từ 100 đến 450).
      3. Mỗi nhánh chính chia thêm 2-3 ý chi tiết (Cấp 2), nằm xa hơn về bên phải (x khoảng 800 đến 850).
      4. Tất cả các đường nối edges đều phải liên kết đúng từ source (cha) đến target (con).
    `;

    // Gọi mô hình gemini-3.6-flash với cấu hình responseSchema bắt buộc trả về JSON
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mindmapSchema,
        temperature: 0.2, // Giảm độ ngẫu nhiên để kết quả cấu trúc ổn định
      },
    });

    const mindmapData = JSON.parse(response.text || '{}');

    return NextResponse.json({ success: true, data: mindmapData });
  } catch (error: any) {
    console.error('Lỗi API Generate Mindmap:', error);
    return NextResponse.json(
      { error: 'Không thể tạo sơ đồ tư duy bằng AI', details: error.message },
      { status: 500 }
    );
  }
}