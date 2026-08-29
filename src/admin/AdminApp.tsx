import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Login } from './Login';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { LoaderCircle, LogOut, Store } from 'lucide-react';

type View = { name: 'list' } | { name: 'new' } | { name: 'edit'; id: number };

export const AdminApp: React.FC = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>({ name: 'list' });
  const [listKey, setListKey] = useState(0); // لإجبار إعادة تحميل القائمة بعد حفظ

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoaderCircle className="w-6 h-6 animate-spin text-[#8B5E3C]" />
      </div>
    );
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#8B5E3C]" />
            <span className="font-extrabold text-gray-900">لوحة تحكم برستيل</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view.name === 'list' && (
          <ProductList
            key={listKey}
            onAddNew={() => setView({ name: 'new' })}
            onEdit={(id) => setView({ name: 'edit', id })}
          />
        )}
        {view.name === 'new' && (
          <ProductForm
            productId={null}
            onDone={() => {
              setListKey((k) => k + 1);
              setView({ name: 'list' });
            }}
            onCancel={() => setView({ name: 'list' })}
          />
        )}
        {view.name === 'edit' && (
          <ProductForm
            productId={view.id}
            onDone={() => {
              setListKey((k) => k + 1);
              setView({ name: 'list' });
            }}
            onCancel={() => setView({ name: 'list' })}
          />
        )}
      </main>
    </div>
  );
};
