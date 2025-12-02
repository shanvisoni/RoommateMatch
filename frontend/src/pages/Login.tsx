import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-white">
        <LoginForm />
      </div>
      <div className="hidden md:block relative bg-[#1f3256]">
        <img
          src="/images/auth-side.jpg"
          alt="Roommate lifestyle"
          className="absolute inset-0 h-full w-full object-contain object-center"
        />
        <div className="absolute inset-0 bg-[#1f3256]/60" />
        <div className="relative z-10 h-full w-full flex items-end p-8 text-white">
          <div>
            <h3 className="text-2xl font-bold">Find the perfect roommate</h3>
            <p className="mt-2 text-white/90">Match, chat and move in with confidence.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
