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

  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

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

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNodes(nodes);
  }, []);

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
    // Handle Union Node Click (Assign Children)
    if (node.type === 'union' && isEditMode && selectedNodes.length > 0) {
      const parentIds = node.data.parentIds as string[];
      if (parentIds && parentIds.length === 2) {
        const childrenToAdd = selectedNodes.filter(n => n.type === 'familyMember' && !parentIds.includes(n.id));
        
        if (childrenToAdd.length > 0) {
          if (confirm(`Привязать выбранных детей (${childrenToAdd.length}) к этому браку?`)) {
            childrenToAdd.forEach(child => {
              // Check if relationship already exists to avoid duplicates
              const exists1 = relationships.some(r => r.person1_id === parentIds[0] && r.person2_id === child.id && r.type === 'parent_child');
              const exists2 = relationships.some(r => r.person1_id === parentIds[1] && r.person2_id === child.id && r.type === 'parent_child');
              
              if (!exists1) addRelationship({ person1_id: parentIds[0], person2_id: child.id, type: 'parent_child' });
              if (!exists2) addRelationship({ person1_id: parentIds[1], person2_id: child.id, type: 'parent_child' });
            });
            // Clear selection after action
            setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
            setSelectedNodes([]);
          }
        }
      }
      return;
    }

    // Handle Person Click
    if (node.type === 'familyMember') {
      const person = node.data.person as Person;
      setSelectedPerson(person);
      if (isEditMode) {
        setIsModalOpen(true);
      } else {
        setIsViewModalOpen(true);
      }
    }
  };

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    if (!isEditMode) return;
    
    const rel = relationships.find(r => r.id === edge.id);
    
    // Handle Spouse Edge Click (Assign Children)
    if (rel && rel.type === 'spouse' && selectedNodes.length > 0) {
       const childrenToAdd = selectedNodes.filter(n => n.type === 'familyMember' && n.id !== rel.person1_id && n.id !== rel.person2_id);
       
       if (childrenToAdd.length > 0) {
          if (confirm(`Привязать выбранных детей (${childrenToAdd.length}) к этому браку?`)) {
            childrenToAdd.forEach(child => {
               const exists1 = relationships.some(r => r.person1_id === rel.person1_id && r.person2_id === child.id && r.type === 'parent_child');
               const exists2 = relationships.some(r => r.person1_id === rel.person2_id && r.person2_id === child.id && r.type === 'parent_child');
               
               if (!exists1) addRelationship({ person1_id: rel.person1_id, person2_id: child.id, type: 'parent_child' });
               if (!exists2) addRelationship({ person1_id: rel.person2_id, person2_id: child.id, type: 'parent_child' });
            });
            setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
            setSelectedNodes([]);
            return; // Skip opening modal
          }
       }
    }

    if (rel) {
      setSelectedRelationship(rel);
      setIsRelModalOpen(true);
    }
  };

  const handleCreateSpouseConnection = () => {
    if (selectedNodes.length !== 2) return;
    const [p1, p2] = selectedNodes;
    
    // Check if already connected
    const exists = relationships.some(r => 
      (r.person1_id === p1.id && r.person2_id === p2.id && r.type === 'spouse') ||
      (r.person1_id === p2.id && r.person2_id === p1.id && r.type === 'spouse')
    );

    if (exists) {
      alert('Эти люди уже являются супругами.');
      return;
    }

    addRelationship({
      person1_id: p1.id,
      person2_id: p2.id,
      type: 'spouse'
    });
    
    // Clear selection
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setSelectedNodes([]);
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
        onSelectionChange={onSelectionChange}
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
            
            {selectedNodes.length === 2 && (
              <button
                onClick={handleCreateSpouseConnection}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all"
              >
                Связать как супругов
              </button>
            )}

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
