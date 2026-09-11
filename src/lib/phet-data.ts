export interface PhetSimulation {
  id?: string;
  topic: string;
  title?: string;
  subject?: string;
  grade: string;
  url: string;
  embedUrl?: string;
  embedHtml?: string;
  embedType?: 'url' | 'html';
  description?: string;
  guideSteps?: string[];
  isTeacherCreated?: boolean;
}

export const PHET_SIMULATIONS: PhetSimulation[] = [
  // --- Danh sách thí nghiệm  ---
  {
    topic: 'Mạch điện / Dòng điện',
    grade: '7',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_vi.html'
  },
  {
    topic: 'Áp suất / Áp suất chất lỏng',
    grade: '8',
    url: 'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_vi.html'
  },
  {
    topic: 'Tế bào / Kính hiển vi',
    grade: '6',
    url: 'https://phet.colorado.edu/sims/html/build-a-cell/latest/build-a-cell_vi.html'
  },

  // --- Các thí nghiệm đính kèm bổ sung ---
  {
    id: 'sim-density',
    topic: 'Khối lượng riêng & Lực đẩy Archimedes',
    title: 'Khối lượng riêng & Lực đẩy Archimedes',
    subject: 'Vật lý',
    grade: '6',
    url: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html?locale=vi',
    embedType: 'url',
    description: 'Thả các vật thể chất liệu khác nhau vào nước để tìm hiểu về khối lượng riêng và sự nổi.',
    guideSteps: [
      'Chọn vật liệu (Gỗ, Băng, Thạch anh, Nhôm...).',
      'Thả vật vào bể nước và xem thể tích nước dâng lên.',
      'So sánh khối lượng riêng của vật với khối lượng riêng của nước (1 kg/L).'
    ]
  },
  {
    id: 'sim-circuit',
    topic: 'Lắp ráp Mạch điện Một chiều (DC)',
    title: 'Lắp ráp Mạch điện Một chiều (DC)',
    subject: 'Vật lý',
    grade: '8',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html?locale=vi',
    embedType: 'url',
    description: 'Tự tay thiết kế mạch điện, đo cường độ dòng điện (Ampe kế) và hiệu điện thế (Vôn kế).',
    guideSteps: [
      'Kéo dây dẫn, pin, và bóng đèn ra thảm đấu nối.',
      'Đóng công tắc để kiểm tra độ sáng bóng đèn.',
      'Dùng Vôn kế đo điện áp giữa 2 đầu bóng đèn.'
    ]
  },
  {
    id: 'sim-acid-base',
    topic: 'Dung dịch Acid - Base & Độ pH',
    title: 'Dung dịch Acid - Base & Độ pH',
    subject: 'Hóa học',
    grade: '8',
    url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html?locale=vi',
    embedType: 'url',
    description: 'Khám phá sự phân ly của Acid/Base, so sánh độ dẫn điện và đo độ pH dung dịch.',
    guideSteps: [
      'Nhúng giấy chỉ thị pH hoặc đầu đo điện cực vào dung dịch.',
      'Thay đổi loại chất (Acid mạnh, Acid yếu, Base mạnh, Base yếu).',
      'Quan sát mật độ các ion H3O+ và OH- trong cốc.'
    ]
  },
  {
    id: 'sim_2',
    topic: 'Chuyển Động & Lực (PhET)',
    title: 'Chuyển Động & Lực (PhET)',
    subject: 'Vật Lý',
    grade: 'Mọi lớp',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi',
    embedHtml: '',
    embedType: 'url',
    description: 'Thí nghiệm mô phỏng do Thầy/Cô thiết lập. (Vật Lý)',
    guideSteps: [
      'Tương tác trực tiếp với các thiết bị và quan sát kết quả.'
    ],
    isTeacherCreated: true
  },
  {
    id: 'sim_1',
    topic: 'Mô Phỏng Cấu Tạo Nguyên Tử (PhET)',
    title: 'Mô Phỏng Cấu Tạo Nguyên Tử (PhET)',
    subject: 'Hóa Học',
    grade: 'Mọi lớp',
    url: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi',
    embedHtml: '',
    embedType: 'url',
    description: 'Thí nghiệm mô phỏng do Thầy/Cô thiết lập. (Hóa Học)',
    guideSteps: [
      'Tương tác trực tiếp với các thiết bị và quan sát kết quả.'
    ],
    isTeacherCreated: true
  },
  {
    id: '1788674934861',
    topic: 'Thấu kính',
    title: 'Thấu kính',
    subject: 'Vật Lý',
    grade: 'Mọi lớp',
    url: 'https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_en.html',
    embedUrl: 'https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_en.html',
    embedHtml: '<iframe src="https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_en.html" width="800" height="600" allowfullscreen></iframe>',
    embedType: 'url',
    description: 'Thí nghiệm mô phỏng do Thầy/Cô thiết lập. (Vật Lý)',
    guideSteps: [
      'Tương tác trực tiếp với các thiết bị và quan sát kết quả.'
    ],
    isTeacherCreated: true
  }
];