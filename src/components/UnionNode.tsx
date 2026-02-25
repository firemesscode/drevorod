import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const UnionNode = () => {
  return (
    <div className="w-2 h-2 bg-black rounded-full">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export default memo(UnionNode);
