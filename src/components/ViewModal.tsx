import React from 'react';
import { Person } from '../lib/supabase';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInYears, parseISO } from 'date-fns';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

export default function ViewModal({ isOpen, onClose, person }: ViewModalProps) {
  if (!person) return null;

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return '';
    const start = parseISO(birthDate);
    const end = deathDate ? parseISO(deathDate) : new Date();
    const age = differenceInYears(end, start);
    return age;
  };

  const age = calculateAge(person.birth_date, person.death_date);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '?';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="relative h-32 bg-gray-100">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-sm z-10"
              >
                <X size={20} />
              </button>
              {person.photo_url && (
                <div className="absolute inset-0 overflow-hidden opacity-10 blur-xl">
                   <img src={person.photo_url} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4 flex justify-center">
                <img
                  src={person.photo_url || `https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=random`}
                  alt={`${person.first_name} ${person.last_name}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {person.last_name} {person.first_name} {person.middle_name}
                </h2>
                
                <div className="text-gray-500 text-sm flex flex-col gap-1 items-center">
                  <p>
                    {formatDate(person.birth_date)} 
                    {person.death_date ? ` — ${formatDate(person.death_date)}` : ''}
                  </p>
                  {age !== '' && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      {person.death_date ? `Прожил(а) ${age} лет` : `${age} лет`}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {person.birth_place && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Место рождения</span>
                    <p className="text-gray-800">{person.birth_place}</p>
                  </div>
                )}

                {person.description && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Биография</span>
                    <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {person.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
