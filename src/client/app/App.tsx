import { BrowserRouter, Routes, Route } from 'react-router'
import { HomePage } from '../pages/HomePage'
import { BlogPage } from '../pages/BlogPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog/:blogId" element={<BlogPage />} />
        <Route path="/blog/:blogId/:page" element={<BlogPage />} />
      </Routes>
    </BrowserRouter>
  )
}
