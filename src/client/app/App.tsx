import { BrowserRouter, Routes, Route } from 'react-router'
import { HomePage } from '../pages/HomePage'
import { BlogPage } from '../pages/BlogPage'
import { BlogOrCategoryPage } from '../pages/BlogOrCategoryPage'
import { CategoryPage } from '../pages/CategoryPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog/:blogId" element={<BlogPage />} />
        <Route path="/blog/:blogId/:second" element={<BlogOrCategoryPage />} />
        <Route path="/blog/:blogId/:category/:page" element={<CategoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
