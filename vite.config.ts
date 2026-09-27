/// <reference types="node" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目页需要子路径 base：PAGES_BASE=/<仓库名>/ npm run build
export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
})
