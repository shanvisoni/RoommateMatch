import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-white order-2 md:order-1">
        <RegisterForm />
      </div>
      <div className="hidden md:block relative order-1 md:order-2 bg-[#1f3256]">
        <img
          src="/images/auth-side.jpg"
          alt="Roommate lifestyle"
          className="absolute inset-0 h-full w-full object-contain object-center"
        />
        <div className="absolute inset-0 bg-[#1f3256]/60" />
        <div className="relative z-10 h-full w-full flex items-end p-8 text-white">
          <div>
            <h3 className="text-2xl font-bold">Join RoomieMatch</h3>
            <p className="mt-2 text-white/90">Create your profile and get matched today.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
