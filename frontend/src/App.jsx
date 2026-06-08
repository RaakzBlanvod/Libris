import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Home from './pages/Home/HomePage';
import AuthPage from './pages/Auth/AuthPage';
import Profile from './pages/Profile/ProfilePage';
import Bookmarks from './pages/Bookmarks/BookmarksPage';
import BookDetail from './pages/BookDetail/BookDetailPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import CreateReview from './pages/Reviews/CreateReview';
import Reviews from './pages/Reviews/ReviewsPage';
import Terms from './pages/Terms/TermsPage';
import NotFound from './pages/NotFound/NotFoundPage';

// =============================================================================
// Корень приложения: глобальные провайдеры, роутер и каркас страницы.
//
// Порядок провайдеров: Auth (кто залогинен) → Toast (уведомления) →
// Confirm (модалки подтверждения) — оборачивают весь Router, поэтому доступны
// на любой странице. Внутри: общий Header/Footer и область <main> с маршрутами,
// обёрнутая в ErrorBoundary (ловит ошибки рендера страниц).
// =============================================================================

// При смене маршрута прокручиваем страницу наверх.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-slate-950">
              <Header />

              <main className="flex-grow">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/bookmarks" element={<Bookmarks />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/books/:id" element={<BookDetail />} />
                    <Route path="/books/:id/review" element={<CreateReview />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </main>

              <Footer />
            </div>
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
