"use client";
import { API_URL } from '@/lib/api';
import { useState } from 'react'
import Image from 'next/image';
import { MdLockReset, MdOutlineMailLock } from 'react-icons/md';
import { HiOutlineKey } from 'react-icons/hi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { Label } from 'flowbite-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function page() {
  const router = useRouter()
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });

  // Validate password in real-time
  const validatePassword = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePassword(value);
  };

  const handleSendResetCode = async () => {
    try{
      const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
      })
      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message);
      }
      console.log(data);
      setStep(2);
    }catch(error){
      console.log(error);
    }
  }

  const handleVerifyCode = () => {
    if(isNaN(otp) || otp.length !==6){
      setError('Please enter a valid 6-digit code');
      return;
    }
    setStep(3);
  }

  const handleResetPassword = async () => {
    if(newPassword !== confirmPassword){
      setError("Passwords do not match");
      return;
    }
    try{
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password/${otp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({password: newPassword}),
      })
      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message);
      }
      console.log(data);
      setSuccess("Password reset successfully");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }catch(err){
      setError(err.message);
    }
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#221F1B]">
      
      <div className="relative hidden md:block md:h-full bg-[#287b70] dark:bg-black">
        <Image
          src="/register7.png"
          fill
          className="object-contain w-full h-full"
          alt="Forgot Password visual"
        />
      </div>

      <div className="flex flex-col justify-center px-10 py-12 bg-white xl:w-2/3 w-full mx-auto dark:bg-[#221F1B]">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#29b7a4]/10 dark:bg-[#29b7a4]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLockReset className="text-[#29b7a4] text-4xl" />
          </div>
          {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-2 text-[#29b7a4]">
              Forgot Password?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              No worries! Enter your email and we'll send you a reset code.
            </p>
          </div>
          )}
          {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-2 text-[#29b7a4]">
              Verify OTP
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Enter the OTP sent to your email.
            </p>
            {error === "Please enter a valid 6-digit code" && (
              <p className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded w-full">Please enter a valid 6-digit code</p>
            )}
          </div>
          )}
          {step === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-2 text-[#29b7a4]">
              Reset Password
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Create a new password.
            </p>
            {error === "Passwords do not match" && (
              <p className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded w-full">Passwords do not match</p>
            )}
            {error === "OTP is invalid or has expired" && (
              <p className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded w-full">OTP is invalid or has expired</p>
            )}
            {success === "Password reset successfully" && (
              <p className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded w-full">Password reset successfully</p>
            )}
          </div>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid gap-4">
              <Label htmlFor="email" className="flex items-center gap-2">
                <MdOutlineMailLock />
                Email Address
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#ECECF0] dark:bg-[#37332f] dark:text-white"
                placeholder="email@example.com"
                required
              />
            </div>

            <Button className="w-full" onClick={handleSendResetCode}>
              Send Reset Code
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-[#29b7a4] hover:underline font-medium flex items-center justify-center gap-2">
                <span>←</span> Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="space-y-6">
            {/* OTP Input */}
            <div className="grid gap-4">
              <Label htmlFor="otp" className="flex items-center gap-2">
                <HiOutlineKey />
                Verification Code (OTP)
              </Label>
              <Input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-[#ECECF0] dark:bg-[#37332f] dark:text-white text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Check your email for the 6-digit code
              </p>
            </div>
            <Button className="w-full" onClick={handleVerifyCode}>
              Verify Code
            </Button>

            <div className="text-center space-y-2">
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#29b7a4] dark:hover:text-[#29b7a4] font-medium block w-full"
              >
                Didn't receive code? Resend
              </button>
              <Link href="/login" className="text-sm text-[#29b7a4] hover:underline font-medium flex items-center justify-center gap-2">
                <span>←</span> Back to Login
              </Link>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className='border border-[#ECECF0] dark:border-[#37332f] p-4 rounded-md space-y-2'>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">{passwordValidation.minLength ? '✅' : '❌'}</span>
                must be 8 characters or more
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">{passwordValidation.hasUppercase ? '✅' : '❌'}</span>
                must contain at least one uppercase letter
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">{passwordValidation.hasLowercase ? '✅' : '❌'}</span>
                must contain at least one lowercase letter
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">{passwordValidation.hasDigit ? '✅' : '❌'}</span>
                must contain at least one digit
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">{passwordValidation.hasSpecialChar ? '✅' : '❌'}</span>
                must contain at least one special character (@$!%*?&)
              </p>
            </div>
            <div className="grid gap-4">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <RiLockPasswordLine />
                New Password
              </Label>
              <Input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                className="bg-[#ECECF0] dark:bg-[#37332f] dark:text-white"
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="grid gap-4">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <RiLockPasswordLine />
                Confirm Password
              </Label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#ECECF0] dark:bg-[#37332f] dark:text-white"
                placeholder="Confirm new password"
                required
              />
            </div>

            <Button className="w-full" onClick={handleResetPassword}>
              Reset Password
            </Button>
            <div className="text-center">
              <p onClick={() => {setStep(2)}} className="cursor-pointer text-sm text-[#29b7a4] hover:underline font-medium flex items-center justify-center gap-2">
                <span>←</span> Back to Verify OTP
              </p>
            </div>
          </div>
        )}

        {/* Success Message (Optional - can be shown after reset) */}
        {/* <div className="text-center space-y-4 hidden">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Password Reset Successfully!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your password has been reset. You can now login with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </div> */}

      </div>
    </div>
  );
}



