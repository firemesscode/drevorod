import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Relationship } from '../lib/supabase';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: Relationship | null;
}

export default function RelationshipModal({ isOpen, onClose, relationship }: RelationshipModalProps) {
  const { updateRelationship, deleteRelationship } = useStore();
  const [formData, setFormData] = useState<Partial<Relationship>>({});

  useEffect(() => {
    if (relationship) {
      setFormData(relationship);
    }
  }, [relationship, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relationship) return;

    await updateRelationship(relationship.id, formData);
    onClose();
  };

  const handleDelete = async () => {
    if (relationship && confirm('Вы уверены, что хотите удалить эту связь?')) {
      try {
        await deleteRelationship(relationship.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete relationship:', error);
        alert('Не удалось удалить связь. Попробуйте еще раз.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && relationship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Редактировать связь</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Тип связи</label>
                <select
                  value={formData.type || 'parent_child'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as 'parent_child' | 'spouse' })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                >
                  <option value="parent_child">Родитель - Ребенок</option>
                  <option value="spouse">Супруги</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Метка (например, "Бывшая жена")</label>
                <input
                  type="text"
                  value={formData.meta || ''}
                  onChange={e => setFormData({ ...formData, meta: e.target.value })}
                  placeholder="Необязательно"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Удалить
                </button>
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
