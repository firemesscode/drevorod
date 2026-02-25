import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../lib/store';
import FamilyNode from './FamilyNode';
import EditModal from './EditModal';
import ViewModal from './ViewModal';
import RelationshipModal from './RelationshipModal';
import UnionNode from './UnionNode';
import { Relationship, Person } from '../lib/supabase';
import { Plus } from 'lucide-react';

const nodeTypes = {
  familyMember: FamilyNode,
  union: UnionNode,
};

export default function FamilyTree() {
  const { 
    fetchData, 
    getLayoutedElements, 
    isEditMode, 
    addRelationship,
    people,
    relationships 
  } = useStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update layout when data changes
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements();
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [people, relationships, getLayoutedElements, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isEditMode) return;
      
      addRelationship({
        person1_id: params.source,
        person2_id: params.target,
        type: 'parent_child',
      });
    },
    [isEditMode, addRelationship]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const person = node.data.person as Person;
    setSelectedPerson(person);
    if (isEditMode) {
      setIsModalOpen(true);
    } else {
      setIsViewModalOpen(true);
    }
  };

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    if (!isEditMode) return;
    const rel = relationships.find(r => r.id === edge.id);
    if (rel) {
      setSelectedRelationship(rel);
      setIsRelModalOpen(true);
    }
  };

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-screen bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
      >
        <Background gap={20} color="#f1f1f1" />
        <Controls showInteractive={false} className="!bg-white !shadow-md !border-gray-100 !rounded-lg" />
        <MiniMap 
          nodeColor="#000" 
          maskColor="rgba(255, 255, 255, 0.8)"
          className="!bg-white !border-gray-100 !shadow-md !rounded-lg"
        />

        {isEditMode && (
          <Panel position="top-right" className="flex flex-col gap-2 items-end">
            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-xs text-gray-500 max-w-[200px] text-right">
              Перетаскивайте карточки для настройки. <br/> Тяните за черные точки для создания связей.
            </div>
            <button
              onClick={handleAddPerson}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all"
            >
              <Plus size={16} />
              Добавить
            </button>
          </Panel>
        )}
      </ReactFlow>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        person={selectedPerson}
      />

      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        person={selectedPerson}
      />

      <RelationshipModal
        isOpen={isRelModalOpen}
        onClose={() => setIsRelModalOpen(false)}
        relationship={selectedRelationship}
      />
    </div>
  );
}
