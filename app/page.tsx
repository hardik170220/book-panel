"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const APDashboardLogin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();
  const { data: session, status } = useSession();

  


  // ✅ Show nothing while checking session (avoids flicker)
  if (status === "loading" || (status === "authenticated" && !session?.user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Checking session...
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        // ✅ Fetch the latest session to get role
        setTimeout(async () => {
          const res = await fetch("/api/auth/session");
          const newSession = await res.json();
          if (newSession?.user?.role === "submission-admin") {
            router.push("/admin/bookorder");
          } else {
            router.push("/admin/dashboard");
          }
        }, 300);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative font-poppins flex items-center justify-center p-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('Mahabharat.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-10"></div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md">
        <div className="bg-white rounded-sm shadow-lg overflow-hidden backdrop-blur-sm">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <img src="/logo.png" className="h-12" alt="AP" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Ap Book Panel</h1>
              {/* <p className="text-gray-300 text-sm">
                Access your administrative panel
              </p> */}
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 placeholder:text-sm py-2 border text-gray-900 border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                    placeholder="First Name..."
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 text-gray-900 pr-12 py-2 border border-gray-300 placeholder:text-sm rounded-sm focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                    placeholder="Password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
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

             

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full bg-gray-900 font-poppins text-gray-100 py-3.5 px-4 rounded-sm border border-gray-300 font-bold text-base transition-all duration-200 hover:from-gray-500 hover:to-gray-600 focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-md transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-1 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <span>Login</span>
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