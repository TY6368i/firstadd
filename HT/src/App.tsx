import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { TextCaptchaPage } from './pages/TextCaptchaPage'
import { ImageCaptchaPage } from './pages/ImageCaptchaPage'
import { RecaptchaClickPage } from './pages/RecaptchaClickPage'
import { MCABenchHomePage } from './pages/MCABenchHomePage'
import { MCACategoryPage } from './pages/MCACategoryPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/captcha/text" element={<TextCaptchaPage />} />
      <Route path="/captcha/image" element={<ImageCaptchaPage />} />
      <Route path="/captcha/recaptcha-click" element={<RecaptchaClickPage />} />
      <Route path="/captcha/mca" element={<MCABenchHomePage />} />
      <Route path="/captcha/mca/:categoryKey" element={<MCACategoryPage />} />
      <Route
        path="/captcha/placeholder/:slug"
        element={<PlaceholderPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
