import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Person } from '../lib/supabase';
import { differenceInYears, parseISO } from 'date-fns';
import { clsx } from 'clsx';

const calculateAge = (birthDate?: string, deathDate?: string) => {
  if (!birthDate) return '';
  const start = parseISO(birthDate);
  const end = deathDate ? parseISO(deathDate) : new Date();
  const age = differenceInYears(end, start);
  return age;
};

const FamilyNode = ({ data, selected }: NodeProps & { data: { person: Person } }) => {
  const { person } = data;
  const age = calculateAge(person.birth_date, person.death_date);

  return (
    <div
      className={clsx(
        'w-64 bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden group',
        selected ? 'border-black ring-1 ring-black shadow-md' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-black !w-2 !h-2" />
      
      <div className="flex items-center p-3 gap-3">
        <div className="relative w-12 h-12 shrink-0">
          <img
            src={person.photo_url || `https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=random`}
            alt={`${person.first_name} ${person.last_name}`}
            className="w-full h-full rounded-full object-cover border border-gray-100"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {person.last_name} {person.first_name} {person.middle_name}
          </h3>
          <div className="text-xs text-gray-500 flex flex-col">
            <span>
              {person.birth_date ? new Date(person.birth_date).getFullYear() : '?'} 
              {person.death_date ? ` - ${new Date(person.death_date).getFullYear()}` : ''}
            </span>
            {age !== '' && (
              <span className="text-gray-400">
                {person.death_date ? `Прожил(а) ${age} лет` : `${age} лет`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details on hover or selection could go here, 
          but for mobile optimization we keep it clean and use a click handler in the parent */}
      
      <Handle type="source" position={Position.Bottom} className="!bg-black !w-2 !h-2" />
    </div>
  );
};

export default memo(FamilyNode);
