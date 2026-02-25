import { create } from 'zustand';
import { supabase, Person, Relationship } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { Edge, Node } from '@xyflow/react';
import dagre from 'dagre';

// Demo Data for when Supabase is not connected
const DEMO_PEOPLE: Person[] = [
  {
    id: '1',
    first_name: 'Иван',
    middle_name: 'Иванович',
    last_name: 'Иванов',
    birth_date: '1950-01-01',
    birth_place: 'Москва',
    photo_url: 'https://picsum.photos/seed/grandpa/200/200',
    description: 'Глава семьи.',
  },
  {
    id: '2',
    first_name: 'Мария',
    middle_name: 'Петровна',
    last_name: 'Иванова',
    birth_date: '1952-05-15',
    birth_place: 'Санкт-Петербург',
    photo_url: 'https://picsum.photos/seed/grandma/200/200',
    description: 'Любит печь пироги.',
  },
  {
    id: '3',
    first_name: 'Алексей',
    middle_name: 'Иванович',
    last_name: 'Иванов',
    birth_date: '1975-03-10',
    birth_place: 'Екатеринбург',
    photo_url: 'https://picsum.photos/seed/father/200/200',
    description: 'Работает программистом.',
  },
  {
    id: '4',
    first_name: 'Елена',
    middle_name: 'Сергеевна',
    last_name: 'Иванова',
    birth_date: '1978-08-20',
    birth_place: 'Новосибирск',
    photo_url: 'https://picsum.photos/seed/mother/200/200',
    description: 'Художник.',
  },
  {
    id: '5',
    first_name: 'Дмитрий',
    middle_name: 'Алексеевич',
    last_name: 'Иванов',
    birth_date: '2005-11-05',
    birth_place: 'Казань',
    photo_url: 'https://picsum.photos/seed/son/200/200',
    description: 'Студент.',
  },
];

const DEMO_RELATIONSHIPS: Relationship[] = [
  { id: 'r1', person1_id: '1', person2_id: '2', type: 'spouse' },
  { id: 'r2', person1_id: '1', person2_id: '3', type: 'parent_child' },
  { id: 'r3', person1_id: '2', person2_id: '3', type: 'parent_child' },
  { id: 'r4', person1_id: '3', person2_id: '4', type: 'spouse' },
  { id: 'r5', person1_id: '3', person2_id: '5', type: 'parent_child' },
  { id: 'r6', person1_id: '4', person2_id: '5', type: 'parent_child' },
];

interface AppState {
  people: Person[];
  relationships: Relationship[];
  isEditMode: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  setEditMode: (isEdit: boolean) => void;
  addPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addRelationship: (rel: Omit<Relationship, 'id'>) => Promise<void>;
  updateRelationship: (id: string, updates: Partial<Relationship>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;
  
  // Layout helper
  getLayoutedElements: () => { nodes: Node[]; edges: Edge[] };
}

export const useStore = create<AppState>((set, get) => ({
  people: [],
  relationships: [],
  isEditMode: false,
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    
    if (!supabase) {
      console.log('Supabase not configured, using demo data');
      set({ people: DEMO_PEOPLE, relationships: DEMO_RELATIONSHIPS, isLoading: false });
      return;
    }

    try {
      const { data: people, error: peopleError } = await supabase.from('people').select('*');
      const { data: relationships, error: relError } = await supabase.from('relationships').select('*');

      if (peopleError) throw peopleError;
      if (relError) throw relError;

      set({ people: people || [], relationships: relationships || [], isLoading: false });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  setEditMode: (isEdit) => set({ isEditMode: isEdit }),

  addPerson: async (person) => {
    if (!supabase) {
      const newPerson = { ...person, id: uuidv4() };
      set((state) => ({ people: [...state.people, newPerson] }));
      return;
    }
    const { data, error } = await supabase.from('people').insert(person).select().single();
    if (error) throw error;
    set((state) => ({ people: [...state.people, data] }));
  },

  updatePerson: async (id, updates) => {
    if (!supabase) {
      set((state) => ({
        people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      return;
    }
    const { data, error } = await supabase.from('people').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set((state) => ({
      people: state.people.map((p) => (p.id === id ? data : p)),
    }));
  },

  deletePerson: async (id) => {
    if (!supabase) {
      set((state) => ({
        people: state.people.filter((p) => p.id !== id),
        relationships: state.relationships.filter(r => r.person1_id !== id && r.person2_id !== id)
      }));
      return;
    }
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
      relationships: state.relationships.filter(r => r.person1_id !== id && r.person2_id !== id)
    }));
  },

  addRelationship: async (rel) => {
    if (!supabase) {
      const newRel = { ...rel, id: uuidv4() };
      set((state) => ({ relationships: [...state.relationships, newRel] }));
      return;
    }
    const { data, error } = await supabase.from('relationships').insert(rel).select().single();
    if (error) throw error;
    set((state) => ({ relationships: [...state.relationships, data] }));
  },

  updateRelationship: async (id, updates) => {
    if (!supabase) {
      set((state) => ({
        relationships: state.relationships.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
      return;
    }
    const { data, error } = await supabase.from('relationships').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set((state) => ({
      relationships: state.relationships.map((r) => (r.id === id ? data : r)),
    }));
  },

  deleteRelationship: async (id) => {
    if (!supabase) {
      set((state) => ({ relationships: state.relationships.filter((r) => r.id !== id) }));
      return;
    }
    const { error } = await supabase.from('relationships').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ relationships: state.relationships.filter((r) => r.id !== id) }));
  },

  getLayoutedElements: () => {
    const { people, relationships } = get();
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 250;
    const nodeHeight = 100;
    const unionNodeSize = 10;

    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 50 });

    // Add all people nodes
    people.forEach((person) => {
      dagreGraph.setNode(person.id, { width: nodeWidth, height: nodeHeight });
    });

    // Process relationships to find shared children
    const childToParents = new Map<string, string[]>();
    
    relationships.forEach(rel => {
      if (rel.type === 'parent_child') {
        const parents = childToParents.get(rel.person2_id) || [];
        parents.push(rel.person1_id);
        childToParents.set(rel.person2_id, parents);
      }
    });

    // Group children by parent pairs
    const parentPairsToChildren = new Map<string, string[]>();
    const singleParentChildren = new Map<string, string[]>(); // childId -> parentId

    childToParents.forEach((parents, childId) => {
      if (parents.length === 2) {
        // Sort parents to ensure consistent key
        const sortedParents = [...parents].sort();
        const key = sortedParents.join('-');
        const children = parentPairsToChildren.get(key) || [];
        children.push(childId);
        parentPairsToChildren.set(key, children);
      } else {
        // Handle single parents or > 2 parents (edge case) individually
        parents.forEach(pId => {
          const key = `${pId}-${childId}`; // Unique key for single parent edge
          // We'll just add edges directly later, but let's track them if needed
        });
      }
    });

    // Add Union Nodes and Edges
    const unionNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    const processedChildrels = new Set<string>(); // Track which parent-child rels are handled by unions

    parentPairsToChildren.forEach((children, key) => {
      const [p1, p2] = key.split('-');
      const unionId = `union-${key}`;
      
      // Check if these parents are actually spouses
      const isSpouse = relationships.some(r => 
        (r.person1_id === p1 && r.person2_id === p2 && r.type === 'spouse') ||
        (r.person1_id === p2 && r.person2_id === p1 && r.type === 'spouse')
      );

      if (isSpouse) {
        // Add Union Node
        dagreGraph.setNode(unionId, { width: unionNodeSize, height: unionNodeSize });
        unionNodes.push({
          id: unionId,
          type: 'union',
          position: { x: 0, y: 0 },
          data: { label: '', parentIds: [p1, p2] },
          draggable: false,
          connectable: false,
        });

        // Edges from Parents to Union
        dagreGraph.setEdge(p1, unionId);
        dagreGraph.setEdge(p2, unionId);
        
        generatedEdges.push({
          id: `e-${p1}-${unionId}`,
          source: p1,
          target: unionId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#000' },
        });
        generatedEdges.push({
          id: `e-${p2}-${unionId}`,
          source: p2,
          target: unionId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#000' },
        });

        // Edges from Union to Children
        children.forEach(childId => {
          dagreGraph.setEdge(unionId, childId);
          generatedEdges.push({
            id: `e-${unionId}-${childId}`,
            source: unionId,
            target: childId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#000' },
          });
          
          // Mark these relationships as processed so we don't add direct edges
          // We need to find the original relationship IDs to mark them? 
          // Actually we just need to know NOT to add the default edges for these.
          // We can filter the default loop.
        });
      }
    });

    // Add remaining relationships (Spouses and Single Parents)
    relationships.forEach((rel) => {
      if (rel.type === 'spouse') {
        dagreGraph.setEdge(rel.person1_id, rel.person2_id);
        generatedEdges.push({
          id: rel.id,
          source: rel.person1_id,
          target: rel.person2_id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#F27D26', strokeDasharray: '5,5' },
          label: rel.meta,
        });
      } else if (rel.type === 'parent_child') {
        // Check if this relationship is already covered by a union
        const parents = childToParents.get(rel.person2_id);
        const isCoveredByUnion = parents && parents.length === 2 && (() => {
           const sortedParents = [...parents].sort();
           const key = sortedParents.join('-');
           return parentPairsToChildren.has(key) && relationships.some(r => 
             (r.person1_id === sortedParents[0] && r.person2_id === sortedParents[1] && r.type === 'spouse') ||
             (r.person1_id === sortedParents[1] && r.person2_id === sortedParents[0] && r.type === 'spouse')
           );
        })();

        if (!isCoveredByUnion) {
          dagreGraph.setEdge(rel.person1_id, rel.person2_id);
          generatedEdges.push({
            id: rel.id,
            source: rel.person1_id,
            target: rel.person2_id,
            type: 'default',
            animated: false,
            style: { stroke: '#000' },
            label: rel.meta,
          });
        }
      }
    });

    dagre.layout(dagreGraph);

    const nodes: Node[] = people.map((person) => {
      const nodeWithPosition = dagreGraph.node(person.id);
      return {
        id: person.id,
        type: 'familyMember',
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
        data: { person },
      };
    });

    // Add union nodes with calculated positions
    const layoutedUnionNodes = unionNodes.map(uNode => {
      const nodeWithPosition = dagreGraph.node(uNode.id);
      return {
        ...uNode,
        position: {
          x: nodeWithPosition.x - unionNodeSize / 2,
          y: nodeWithPosition.y - unionNodeSize / 2,
        },
      };
    });

    return { nodes: [...nodes, ...layoutedUnionNodes], edges: generatedEdges };
  },
}));
