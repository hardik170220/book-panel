"use client"
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const APDashboardLogin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<any>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        // Successful login
        router.push('/admin/create-form');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-black text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-gray-800 to-black opacity-90"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
               <img src="/logo.png" className='h-12' alt="AP" />
              </div>
              <h1 className="text-2xl font-bold mb-2">AP Forms</h1>
              <p className="text-gray-300 text-sm">Access your administrative panel</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 text-black pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

             
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APDashboardLogin;