import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '스마트 정밀 평면도 & 가구 배치 시뮬레이터',
  description: '이사 전 방 실측 사이즈, 벽 두께, 인터넷선 및 콘센트 위치 배치, 가구 자석 회전 스냅 지원 툴',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased h-screen overflow-hidden bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
