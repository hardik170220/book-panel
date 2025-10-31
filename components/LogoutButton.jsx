import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LogoutButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogoutClick = () => {
    setShowDialog(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        redirect: false, // Don't auto redirect
        callbackUrl: '/login'
      });
      
      // Manual redirect after successful logout
      router.push('/login');
      router.refresh(); // Ensure page refreshes
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowDialog(false);
    }
  };

  const handleCancelLogout = () => {
    setShowDialog(false);
  };

  // Don't show logout button if user is not logged in
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Logout Button */}
      <button
        onClick={handleLogoutClick}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        disabled={isLoggingOut}
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>

      {/* Confirmation Dialog Backdrop */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Dialog */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900">Confirm Logout</h3>
                </div>
                <button
                  onClick={handleCancelLogout}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  disabled={isLoggingOut}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to logout from your account?
              </p>
              <p className="text-sm text-gray-500">
                You will need to sign in again to access the dashboard.
              </p>
              
              {session?.user && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Logged in as: <span className="font-medium">{session.user.email}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex space-x-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Yes, Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;