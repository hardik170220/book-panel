"use client"
import React from 'react';
import { ShieldX, ArrowLeft, Home, Lock } from 'lucide-react';

export default function AccessDenied() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-linear-to-br font-poppins from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-300 dark:bg-gray-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gray-400 dark:bg-gray-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gray-300 dark:bg-gray-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main Content Card */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Decorative Top Border */}
          <div className="bg-linear-to-r from-gray-800 via-gray-600 to-gray-900 dark:from-gray-300 dark:via-gray-500 dark:to-gray-200"></div>
          
          <div className="p-8 md:p-12">
            {/* Icon Section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Outer Ring */}
                <div className="absolute inset-0 bg-gray-800 dark:bg-gray-300 rounded-full animate-ping opacity-20"></div>
                
                {/* Icon Container */}
                <div className="relative bg-linear-to-br from-gray-800 to-black dark:from-gray-300 dark:to-gray-100 rounded-full p-6 shadow-lg">
                  <ShieldX className="w-12 h-12 text-white dark:text-gray-900" strokeWidth={2} />
                </div>
                
                {/* Small Lock Icon */}
                <div className="absolute -bottom-2 -right-2 bg-gray-700 dark:bg-gray-400 rounded-full p-2 shadow-lg border-4 border-white dark:border-gray-800">
                  <Lock className="w-3 h-3 text-white dark:text-gray-900" />
                </div>
              </div>
            </div>

            {/* Error Code */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-full">
                Error 403
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-center mb-4 bg-linear-to-r from-gray-900 via-gray-700 to-black dark:from-gray-100 dark:via-gray-300 dark:to-white bg-clip-text text-transparent">
              Access Denied
            </h1>

          

            {/* Additional Info Box */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="w-6 h-6 bg-gray-800 dark:bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white dark:text-gray-900 text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Why am I seeing this?
                  </h3>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Your account may not have the required permissions</li>
                    <li>• The page you're trying to access is restricted</li>
                    <li>• Your session may have expired</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-gray-800 to-black dark:from-gray-300 dark:to-gray-100 hover:from-gray-900 hover:to-gray-800 dark:hover:from-gray-400 dark:hover:to-gray-200 text-white dark:text-gray-900 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </button>
            </div>

           
          </div>
        </div>

        
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}