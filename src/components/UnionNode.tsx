import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const UnionNode = () => {
  return (
    <div className="w-4 h-4 bg-black rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export default memo(UnionNode);
