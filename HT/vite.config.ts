import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 기본은 VITE_만 클라이언트에 노출됩니다. NEXT_PUBLIC_*만 쓰는 배포(Vercel 등)에서도
// Supabase URL/키가 import.meta.env에 들어가도록 접두사를 둘 다 허용합니다.
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
