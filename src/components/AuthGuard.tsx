import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthGuard() {
  const { isEditMode, setEditMode } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2055') {
      setEditMode(true);
      setIsOpen(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    setEditMode(false);
  };

  return (
    <>
      <button
        onClick={() => isEditMode ? handleLogout() : setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-white shadow-lg rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-center">Введите пароль</h3>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  className="w-full px-4 py-2 text-center text-2xl tracking-widest rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 text-center">Неверный пароль</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-sm text-white bg-black hover:bg-gray-800 rounded-xl"
                  >
                    Войти
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
