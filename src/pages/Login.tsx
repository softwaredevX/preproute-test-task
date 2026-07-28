import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import loginIllustration from '../assets/login-illustration.png';
import logo from '../assets/logo.png';
import { loginUser } from '../services/api';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser, logout } = useAuthStore();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await loginUser({
        userId: data.username,
        password: data.password
      });

      if (response.data.status === 'success') {
        setToken(response.data.data.token);
        setUser(response.data.data.user);
        navigate(from, { replace: true });
      } else {
        logout(); // clear any stale token so the auth guard doesn't pass
        setError('root', { message: response.data.message || 'Invalid username or password' });
      }
    } catch (error: any) {
      logout(); // clear any stale token so the auth guard doesn't pass
      setError('root', { message: error.response?.data?.message || 'Invalid username or password' });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      {/* Left side illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[#F7F9FC]">
        <img src={loginIllustration} alt="Login Illustration" className="w-[80%] max-w-[600px] object-contain" />
      </div>

      {/* Right side form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-32 bg-[#F7F9FC]">
        <div className="mx-auto w-full max-w-[500px] bg-white p-12 rounded-xl border border-blue-100 shadow-sm h-[600px] flex flex-col justify-center relative">
          
          <div className="mb-8">
            <img src={logo} alt="PrepRoute" className="h-8 mb-8 object-contain" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Login</h2>
            <p className="text-[13px] text-gray-500 mb-8">
              Use your company provided Login credentials
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {errors.root.message}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  className={`block w-full px-4 py-3 bg-white border ${errors.username ? 'border-red-300 ring-red-100' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter User ID"
                />
                {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={`block w-full px-4 py-3 bg-white border ${errors.password ? 'border-red-300 ring-red-100' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter Password"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            <div className="flex items-center">
              <a href="#" className="text-xs font-semibold text-[#6384F6] hover:text-[#4E71E6]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 mt-8 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#6384F6] hover:bg-[#4E71E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6384F6] transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

