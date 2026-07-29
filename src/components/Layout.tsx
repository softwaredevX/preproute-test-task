import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTestStore } from '../store/testStore';
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, CheckCircle2, Circle, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';
import { DashboardIcon } from '../assets/svg/DashboardIcon';
import { TestCreationIcon } from '../assets/svg/TestCreationIcon';
import { TestTrackingIcon } from '../assets/svg/TestTrackingIcon';

const Layout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { questions, details } = useTestStore();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    useTestStore.getState().clearTest();
    navigate('/login', { replace: true });
  };

  const isQuestionCreation = location.pathname.includes('/add-questions') || location.pathname.includes('/preview-publish');

  const Logo = ({ size = "24" }: { size?: string }) => (
    <img 
      src={logo} 
      alt="PrepRoute" 
      className={`mt-1 object-contain ${size === "24" ? "h-8" : "h-10"}`} 
    />
  );

  return (
    <div className="flex h-screen bg-[#F6F8FC] font-sans">
      {!isQuestionCreation ? (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 py-6">
          <div className="px-8 mb-8 flex items-center">
            <Logo size="24" />
          </div>
          
          <nav className="flex-1 space-y-1 pr-6">
            <Link
              to="/dashboard"
              className={`flex items-center gap-4 px-8 py-3.5 transition-colors text-sm ${
                location.pathname === '/dashboard' || location.pathname === '/'
                  ? 'bg-[#F4F6FF] text-blue-600 font-bold rounded-r-full border-l-4 border-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium border-l-4 border-transparent'
              }`}
            >
              <DashboardIcon size={18} className={location.pathname === '/dashboard' || location.pathname === '/' ? 'text-blue-600' : 'text-gray-400'} />
              Dashboard
            </Link>
            <Link
              to="/create-test"
              className={`flex items-center gap-4 px-8 py-3.5 transition-colors text-sm ${
                location.pathname.startsWith('/create-test')
                  ? 'bg-[#F4F6FF] text-blue-600 font-bold rounded-r-full border-l-4 border-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium border-l-4 border-transparent'
              }`}
            >
              <TestCreationIcon size={18} className={location.pathname.startsWith('/create-test') ? 'text-blue-600' : 'text-gray-400'} />
              Test Creation
            </Link>
            <Link
              to="#"
              className="flex items-center gap-4 px-8 py-3.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium border-l-4 border-transparent transition-colors"
            >
              <TestTrackingIcon size={18} className="text-gray-400" />
              Test Tracking
            </Link>
          </nav>
        </aside>
      ) : (
        /* Alternate Sidebar for Question Creation */
        <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col shrink-0 py-6 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10 relative">
          <div className="px-8 mb-8 flex items-center">
            <Logo size="24" />
          </div>
          
          <div className="px-8 pt-4">
            <Link to="/create-test" className="flex items-center justify-between text-blue-500 hover:text-blue-600 text-sm font-semibold mb-6">
              Question creation <ChevronsLeft size={16} />
            </Link>
            
            <p className="text-sm font-medium text-gray-500 mb-6">
              Total Questions · {Math.max(details?.total_questions || 0, questions.length)}
            </p>
            
            <div className="space-y-3 pr-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {Array.from({
                length: Math.max(details?.total_questions || 0, questions.length),
              }).map((_, idx) => {
                const qNum = idx + 1;
                const isCompleted = idx < questions.length;
                const isCurrent = location.pathname === '/add-questions' && idx === questions.length;

                if (isCompleted) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5 border border-green-400 rounded-full text-green-600 bg-white shadow-sm text-xs font-bold transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={16} className="fill-green-500 text-white flex-shrink-0" />
                        <span className="truncate">Question {qNum}</span>
                      </span>
                      <ChevronsRight size={16} className="text-green-500 flex-shrink-0" />
                    </div>
                  );
                } else if (isCurrent) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5 border-2 border-green-500 rounded-full text-green-600 bg-green-50/60 shadow-sm text-xs font-extrabold"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        <span className="truncate">Question {qNum}</span>
                      </span>
                      <ChevronsRight size={16} className="text-green-500 flex-shrink-0" />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-full text-gray-400 bg-gray-50/50 text-xs font-medium opacity-70"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Circle size={16} className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">Question {qNum}</span>
                      </span>
                      <ChevronsRight size={16} className="text-gray-300 flex-shrink-0" />
                    </div>
                  );
                }
              })}
            </div>
          </div>
          
          <div className="absolute top-[350px] right-0 w-8 h-px bg-gray-200"></div>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="h-[88px] border-b border-gray-100 flex items-center justify-end px-10 shrink-0 bg-white shadow-sm z-20">
          <div className="flex items-center gap-6">
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="relative">
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-4 cursor-pointer select-none p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-orange-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
                    Alex Wando <ChevronDown size={14} className={`text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Admin</span>
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">Alex Wando</p>
                    <p className="text-xs text-gray-400 font-medium truncate">admin@preproute.com</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-red-500" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto bg-white">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

