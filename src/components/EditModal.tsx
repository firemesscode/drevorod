import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Person } from '../lib/supabase';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null; // If null, we are adding a new person
}

export default function EditModal({ isOpen, onClose, person }: EditModalProps) {
  const { addPerson, updatePerson, deletePerson } = useStore();
  const [formData, setFormData] = useState<Partial<Person>>({});

  useEffect(() => {
    if (person) {
      setFormData(person);
    } else {
      setFormData({});
    }
  }, [person, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) return;

    if (person) {
      await updatePerson(person.id, formData);
    } else {
      await addPerson(formData as Person);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (person && confirm('Вы уверены, что хотите удалить этого человека?')) {
      await deletePerson(person.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {person ? 'Редактировать' : 'Добавить человека'}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Фамилия</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ''}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Отчество</label>
                  <input
                    type="text"
                    value={formData.middle_name || ''}
                    onChange={e => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Дата рождения</label>
                  <input
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Дата смерти</label>
                  <input
                    type="date"
                    value={formData.death_date || ''}
                    onChange={e => setFormData({ ...formData, death_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Место рождения</label>
                <input
                  type="text"
                  value={formData.birth_place || ''}
                  onChange={e => setFormData({ ...formData, birth_place: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ссылка на фото</label>
                <input
                  type="url"
                  value={formData.photo_url || ''}
                  onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {person && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    Удалить
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
