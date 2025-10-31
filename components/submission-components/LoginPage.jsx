"use client"
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [hide, setHide] = useState(true);
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const togglePassword = () => {
    setHide(!hide);
  };

  const handleLogin = () => {
    if (password === "mahavir@2550" || "adhyatm@parivar") {
      login(password);
      toast.success("Login successful!");
    } else {
      toast.error("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="relative bg-[url('/Mahabharat.jpg')] bg-cover flex flex-col items-center text-gray-200 justify-center bg-center bg-no-repeat min-h-screen w-full md:bg-fixed">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      <Toaster position="top-center" reverseOrder={false} />
      {/* Make form appear above overlay using relative positioning */}
      <div className='relative w-80 border p-6 backdrop-blur-xl border-gray-600'>
        <h1 className='text-lg uppercase pb-6 font-semibold text-center'>
          Login dashboard
        </h1>
        <div className='flex flex-col gap-4'>
          <div className='relative flex justify-end items-center'>
            <input
              className='py-2 placeholder:text-sm w-full border-0 px-4 outline-none text-gray-800'
              type={hide ? "password" : "text"}
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {hide ? (
              <FaEyeSlash onClick={togglePassword} size={12} className="absolute right-2 text-gray-600 cursor-pointer" />
            ) : (
              <FaEye onClick={togglePassword} size={12} className="absolute right-2 text-gray-600 cursor-pointer" />
            )}
          </div>
          <button onClick={handleLogin} className='py-2 rounded font-semibold bg-blue-600'>
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;