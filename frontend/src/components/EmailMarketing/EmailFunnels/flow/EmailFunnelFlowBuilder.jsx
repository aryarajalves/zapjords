import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiArrowLeft, FiSave, FiDownload, FiTrash2 } from 'react-icons/fi';
import { emailNodeTypes } from './nodeTypes';
import EmailFunnelSidebar from './EmailFunnelSidebar';
import EmailContextMenu from './EmailContextMenu';

export default function EmailFunnelFlowBuilder({
  funnel,
  templates,
  onBack,
  onSave,
  onDelete
}) {
  const [name, setName] = useState(funnel?.name || 'Novo Funil de E-mail');
  const [description, setDescription] = useState(funnel?.description || '');
  const [triggerType, setTriggerType] = useState(funnel?.trigger_type || 'tag');
  const [triggerTag, setTriggerTag] = useState(funnel?.trigger_config?.tag || '');
  const [triggerWebhookStatus, setTriggerWebhookStatus] = useState(funnel?.trigger_config?.status || 'carrinho_abandonado');
  const [stopOnPurchase, setStopOnPurchase] = useState(funnel?.stop_on_purchase ?? true);
  const [stopTagsInput, setStopTagsInput] = useState(
    Array.isArray(funnel?.stop_tags) ? funnel.stop_tags.join(', ') : ''
  );

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [menu, setMenu] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const reactFlowWrapper = useRef(null);

  // Atualizar dados de um nó específico
  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    );
  }, []);

  // Excluir um nó específico
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  // Duplicar um nó específico
  const handleDuplicateNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const sourceNode = nds.find((n) => n.id === nodeId);
      if (!sourceNode || sourceNode.type === 'triggerNode') return nds;

      const newId = `node_${Date.now()}`;
      const duplicatedNode = {
        ...sourceNode,
        id: newId,
        position: {
          x: sourceNode.position.x + 30,
          y: sourceNode.position.y + 60
        },
        data: {
          ...sourceNode.data,
          onUpdateNode: handleUpdateNode,
          onDeleteNode: handleDeleteNode,
          onDuplicateNode: handleDuplicateNode
        }
      };
      return [...nds, duplicatedNode];
    });
  }, [handleUpdateNode, handleDeleteNode]);

  // Inicializar nós e arestas: novo funil vem APENAS com o nó de início (trigger_1)!
  useEffect(() => {
    const initialNodes = [];
    const initialEdges = [];

    // 1. Nó de Início (Trigger)
    initialNodes.push({
      id: 'trigger_1',
      type: 'triggerNode',
      position: { x: 300, y: 50 },
      data: {
        trigger_type: triggerType,
        trigger_config: { tag: triggerTag, status: triggerWebhookStatus }
      }
    });

    // Se o funil já tiver steps salvos, restaura eles; caso seja novo, começa vazio (sem nós pré-configurados)
    const steps = Array.isArray(funnel?.steps) && funnel.steps.length > 0 ? funnel.steps : [];

    let prevNodeId = 'trigger_1';
    let currentY = 250;

    steps.forEach((st, idx) => {
      const nodeId = st.id || `node_${idx + 1}`;
      let flowType = 'emailNode';
      if (st.type === 'delay') flowType = 'delayNode';
      if (st.type === 'tag_action') flowType = 'tagNode';

      initialNodes.push({
        id: nodeId,
        type: flowType,
        position: { x: 300, y: currentY },
        data: {
          ...st,
          templates,
          onUpdateNode: handleUpdateNode,
          onDeleteNode: handleDeleteNode,
          onDuplicateNode: handleDuplicateNode
        }
      });

      initialEdges.push({
        id: `e_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });

      prevNodeId = nodeId;
      currentY += 200;
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [funnel, templates, handleUpdateNode, handleDeleteNode, handleDuplicateNode]);

  // Atualizar o nó de trigger quando a sidebar mudar
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'triggerNode'
          ? {
              ...n,
              data: {
                trigger_type: triggerType,
                trigger_config: { tag: triggerTag, status: triggerWebhookStatus }
              }
            }
          : n
      )
    );
  }, [triggerType, triggerTag, triggerWebhookStatus]);

  // Menu de Contexto (Botão Direito no Canvas)
  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setMenu({
      top: event.clientY,
      left: event.clientX,
      clientX: event.clientX,
      clientY: event.clientY
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, []);

  // Adicionar nós via Sidebar ou Botão Direito no Canvas
  const handleAddNode = (type, fromContextMenu = false) => {
    const id = `node_${Date.now()}`;
    let newX = 300;
    let newY = 250;

    if (fromContextMenu && menu && reactFlowInstance && reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const projected = reactFlowInstance.project({
        x: menu.clientX - bounds.left,
        y: menu.clientY - bounds.top
      });
      newX = Math.round(projected.x);
      newY = Math.round(projected.y);
    } else {
      const lastNode = nodes[nodes.length - 1];
      newY = lastNode ? lastNode.position.y + 190 : 250;
      newX = lastNode ? lastNode.position.x : 300;
    }

    let nodeType = 'emailNode';
    let defaultData = {
      type: 'email',
      template_id: templates[0]?.id || null,
      subject: '',
      templates,
      onUpdateNode: handleUpdateNode,
      onDeleteNode: handleDeleteNode,
      onDuplicateNode: handleDuplicateNode
    };

    if (type === 'delay') {
      nodeType = 'delayNode';
      defaultData = {
        type: 'delay',
        delay_value: 2,
        delay_unit: 'hours',
        onUpdateNode: handleUpdateNode,
        onDeleteNode: handleDeleteNode,
        onDuplicateNode: handleDuplicateNode
      };
    } else if (type === 'tag') {
      nodeType = 'tagNode';
      defaultData = {
        type: 'tag_action',
        action: 'add',
        tag: '',
        onUpdateNode: handleUpdateNode,
        onDeleteNode: handleDeleteNode,
        onDuplicateNode: handleDuplicateNode
      };
    }

    const newNode = {
      id,
      type: nodeType,
      position: { x: newX, y: newY },
      data: defaultData
    };

    setNodes((nds) => [...nds, newNode]);
    setMenu(null);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)
      ),
    []
  );

  // Converter os nós do canvas em sequência ordenada para execução
  const handleSaveFlow = () => {
    // Filtrar nós que não são trigger e ordenar pela posição Y
    const stepNodes = nodes
      .filter((n) => n.type !== 'triggerNode')
      .sort((a, b) => a.position.y - b.position.y);

    const steps = stepNodes.map((n) => {
      const d = n.data;
      if (n.type === 'emailNode') {
        return {
          id: n.id,
          type: 'email',
          template_id: d.template_id,
          subject: d.subject || ''
        };
      } else if (n.type === 'delayNode') {
        return {
          id: n.id,
          type: 'delay',
          delay_value: d.delay_value || 1,
          delay_unit: d.delay_unit || 'hours'
        };
      } else if (n.type === 'tagNode') {
        return {
          id: n.id,
          type: 'tag_action',
          action: d.action || 'add',
          tag: d.tag || ''
        };
      }
      return d;
    });

    const stopTags = stopTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const trigger_config = {};
    if (triggerType === 'tag') trigger_config.tag = triggerTag.trim();
    if (triggerType === 'webhook_status') trigger_config.status = triggerWebhookStatus;

    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger_type: triggerType,
      trigger_config,
      stop_tags: stopTags,
      stop_on_purchase: stopOnPurchase,
      steps
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ name, nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${name.toLowerCase().replace(/\s+/g, '_')}_fluxo.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1d] flex flex-col overflow-hidden text-white">
      
      {/* Barra de Controles Superior */}
      <div className="h-16 bg-slate-900/90 border-b border-white/10 px-6 flex items-center justify-between backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <FiArrowLeft size={14} /> Voltar para Lista
          </button>
          <span className="text-sm font-bold text-white flex items-center gap-2">
            Funil de E-mail: <span className="text-blue-400 font-extrabold">{name}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <FiDownload size={14} /> Exportar JSON
          </button>

          {funnel && (
            <button
              onClick={() => onDelete?.(funnel)}
              className="px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FiTrash2 size={14} /> Excluir Funil
            </button>
          )}

          <button
            onClick={handleSaveFlow}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all"
          >
            <FiSave size={14} /> Salvar Fluxo
          </button>
        </div>
      </div>

      {/* Área Central: Sidebar + Canvas ReactFlow */}
      <div className="flex-1 flex overflow-hidden relative">
        <EmailFunnelSidebar
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          triggerType={triggerType}
          setTriggerType={setTriggerType}
          triggerTag={triggerTag}
          setTriggerTag={setTriggerTag}
          triggerWebhookStatus={triggerWebhookStatus}
          setTriggerWebhookStatus={setTriggerWebhookStatus}
          stopOnPurchase={stopOnPurchase}
          setStopOnPurchase={setStopOnPurchase}
          stopTagsInput={stopTagsInput}
          setStopTagsInput={setStopTagsInput}
          onAddNode={(type) => handleAddNode(type, false)}
        />

        {/* Canvas Infinito de Nós com ReactFlow */}
        <div ref={reactFlowWrapper} className="flex-1 h-full bg-[#070b14] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={emailNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="!bg-slate-900 !border-white/10 !fill-white !text-white rounded-xl overflow-hidden" />
          </ReactFlow>

          {/* Menu de Contexto (Botão Direito no Canvas) */}
          {menu && (
            <EmailContextMenu
              top={menu.top}
              left={menu.left}
              onClose={() => setMenu(null)}
              onAddNode={(type) => handleAddNode(type, true)}
            />
          )}

          {/* Dica no rodapé do canvas */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-gray-400 pointer-events-none">
            Clique com o botão direito para adicionar nós. Conecte as pontas azuis para definir o caminho.
          </div>
        </div>
      </div>

    </div>
  );
}
