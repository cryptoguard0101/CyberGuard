import React from 'react';
import { Check } from 'lucide-react';

import { calculateStrength } from '../utils/passwordUtils';

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculateStrength(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 12; // BSI recommendation
  
  const getColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (password.length === 0) return 'Leer';
    if (strength <= 2) return 'Schwach';
    if (strength <= 4) return 'Gut';
    return 'Sehr stark';
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
        <span>Passwortstärke: <span className={`${strength <= 2 ? 'text-red-500' : strength <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>{getLabel()}</span></span>
        <span>{password.length} Zeichen</span>
      </div>
      
      {/* Strength Bars */}
      <div className="flex gap-1 h-1.5 mb-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${i < strength ? getColor() : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {/* Detailed Checklist */}
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500">
        <li className={`flex items-center gap-1.5 ${isLongEnough ? 'text-green-600 font-medium' : ''}`}>
          <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${isLongEnough ? 'bg-green-100 border-green-200' : 'border-slate-300'}`}>
            {isLongEnough && <Check size={8} />}
          </div>
          Min. 12 Zeichen
        </li>
        <li className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-green-600 font-medium' : ''}`}>
          <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${hasUpper && hasLower ? 'bg-green-100 border-green-200' : 'border-slate-300'}`}>
            {hasUpper && hasLower && <Check size={8} />}
          </div>
          Groß- & Kleinbuchstaben
        </li>
        <li className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600 font-medium' : ''}`}>
           <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${hasNumber ? 'bg-green-100 border-green-200' : 'border-slate-300'}`}>
            {hasNumber && <Check size={8} />}
          </div>
           Zahlen
        </li>
        <li className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-600 font-medium' : ''}`}>
           <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${hasSpecial ? 'bg-green-100 border-green-200' : 'border-slate-300'}`}>
            {hasSpecial && <Check size={8} />}
          </div>
           Sonderzeichen
        </li>
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
