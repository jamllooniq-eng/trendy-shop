import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, Mail, LoaderCircle, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('يرجى إدخال الإيميل وكلمة السر');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError('الإيميل أو كلمة السر غير صحيحة');
      return;
    }

    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#22A39E]/10 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-[#22A39E]" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">لوحة تحكم تريندي</h1>
          <p className="text-sm text-gray-500 mt-1">سجّل الدخول لإدارة المنتجات</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الإيميل</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full text-right pr-10 pl-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#22A39E] focus:ring-2 focus:ring-[#22A39E]/20 outline-none text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="w-full text-right pr-10 pl-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#22A39E] focus:ring-2 focus:ring-[#22A39E]/20 outline-none text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22A39E] hover:bg-[#1c8a86] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'جارِ الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
};
