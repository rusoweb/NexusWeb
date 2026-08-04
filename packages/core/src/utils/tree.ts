import type { NexusNode } from "../types/node.js";
import type { NexusScene } from "../types/scene.js";
import type { NodeType } from "../constants/node-types.js";
import type { ComponentExport, NexusComponent } from "../types/component.js";

export function getChildren(
  nodeId: string,
  nodes: Record<string, NexusNode>,
): NexusNode[] {
  const parent = nodes[nodeId];
  if (!parent) return [];
  return parent.childrenIds.map((id: string) => nodes[id]).filter(Boolean);
}

export function getParent(
  node: NexusNode,
  nodes: Record<string, NexusNode>,
): NexusNode | null {
  if (!node.parentId) return null;
  return nodes[node.parentId] ?? null;
}

export function getNodePath(
  nodeId: string,
  nodes: Record<string, NexusNode>,
): NexusNode[] {
  const path: NexusNode[] = [];
  let current: NexusNode | undefined = nodes[nodeId];

  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = nodes[current.parentId];
  }

  return path;
}

export function getNodeByPath(
  path: string,
  scene: NexusScene,
): NexusNode | null {
  const parts = path.split("/").filter(Boolean);
  let current: NexusNode | undefined = scene.nodes[scene.rootId];

  for (const name of parts) {
    if (!current) return null;
    const child: NexusNode | undefined = getChildren(
      current.id,
      scene.nodes,
    ).find((c) => c.name === name);
    if (!child) return null;
    current = child;
  }

  return current ?? null;
}

export function flattenTree(
  rootId: string,
  nodes: Record<string, NexusNode>,
): NexusNode[] {
  const result: NexusNode[] = [];
  const root = nodes[rootId];
  if (!root) return result;

  function walk(node: NexusNode) {
    result.push(node);
    for (const childId of node.childrenIds) {
      const child = nodes[childId];
      if (child) walk(child);
    }
  }

  walk(root);
  return result;
}

export function getDescendantIds(
  nodeId: string,
  nodes: Record<string, NexusNode>,
): string[] {
  const ids: string[] = [];
  function collect(id: string) {
    const n = nodes[id];
    if (!n) return;
    for (const childId of n.childrenIds) {
      ids.push(childId);
      collect(childId);
    }
  }
  collect(nodeId);
  return ids;
}

export function wouldCreateCycle(
  nodeId: string,
  newParentId: string | null,
  nodes: Record<string, NexusNode>,
): boolean {
  if (!newParentId) return false;
  if (nodeId === newParentId) return true;
  const descendants = getDescendantIds(nodeId, nodes);
  return descendants.includes(newParentId);
}

export function addChild(
  parentId: string,
  child: NexusNode,
  nodes: Record<string, NexusNode>,
): Record<string, NexusNode> {
  if (wouldCreateCycle(child.id, parentId, nodes)) {
    throw new Error(`Cannot add ${child.id} to ${parentId}: cycle detected`);
  }

  const next = { ...nodes };
  next[child.id] = { ...child, parentId };

  const parent = next[parentId];
  if (parent) {
    next[parentId] = {
      ...parent,
      childrenIds: [...parent.childrenIds, child.id],
    };
  }

  return next;
}

export function removeNode(
  nodeId: string,
  nodes: Record<string, NexusNode>,
): Record<string, NexusNode> {
  const node = nodes[nodeId];
  if (!node) return nodes;

  const next = { ...nodes };
  const toDelete: string[] = [nodeId, ...getDescendantIds(nodeId, nodes)];

  for (let i = 0; i < toDelete.length; i++) {
    delete next[toDelete[i]];
  }

  if (node.parentId && next[node.parentId]) {
    const parent = next[node.parentId];
    next[node.parentId] = {
      ...parent,
      childrenIds: parent.childrenIds.filter((id: string) => id !== nodeId),
    };
  }

  return next;
}

export function moveNode(
  nodeId: string,
  newParentId: string | null,
  nodes: Record<string, NexusNode>,
): Record<string, NexusNode> {
  if (wouldCreateCycle(nodeId, newParentId, nodes)) {
    throw new Error(`Cannot move ${nodeId} to ${newParentId}: cycle detected`);
  }

  const node = nodes[nodeId];
  if (!node) return nodes;

  let next = { ...nodes };

  if (node.parentId && next[node.parentId]) {
    const oldParent = next[node.parentId];
    next[node.parentId] = {
      ...oldParent,
      childrenIds: oldParent.childrenIds.filter((id: string) => id !== nodeId),
    };
  }

  if (newParentId && next[newParentId]) {
    const newParent = next[newParentId];
    next[newParentId] = {
      ...newParent,
      childrenIds: [...newParent.childrenIds, nodeId],
    };
  }

  next[nodeId] = { ...node, parentId: newParentId };

  return next;
}

export function extractSubtree(
  rootId: string,
  nodes: Record<string, NexusNode>,
): Record<string, NexusNode> {
  const result: Record<string, NexusNode> = {};
  const root = nodes[rootId];
  if (!root) return result;

  function walk(node: NexusNode, parentId: string | null): NexusNode {
    const clone: NexusNode = {
      ...node,
      parentId,
      childrenIds: [],
      data: { ...node.data },
      style: { ...node.style },
      meta: { ...node.meta },
    };

    result[clone.id] = clone;

    for (const childId of node.childrenIds) {
      const child = nodes[childId];
      if (!child) continue;
      const childClone = walk(child, clone.id);
      clone.childrenIds.push(childClone.id);
    }

    return clone;
  }

  walk(root, null);
  return result;
}

export function createComponentFromSelection(
  selectionRootId: string,
  scene: NexusScene,
  exports: ComponentExport[],
): NexusComponent {
  const subtree = extractSubtree(selectionRootId, scene.nodes);
  const rootNode = subtree[selectionRootId];
  if (!rootNode) {
    throw new Error(`Selection root ${selectionRootId} not found`);
  }

  const componentScene: NexusScene = {
    ...scene,
    id: crypto.randomUUID(),
    name: rootNode.name,
    isComponent: true,
    nodes: subtree,
    rootId: selectionRootId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    id: crypto.randomUUID(),
    name: rootNode.name,
    description: `${rootNode.name} component`,
    category: "Layout",
    exports,
    scene: componentScene,
    version: "0.1.0",
  };
}

export function createNode(
  id: string,
  type: NodeType,
  name: string,
  overrides?: Partial<NexusNode>,
): NexusNode {
  return {
    id,
    type,
    name,
    parentId: null,
    childrenIds: [],
    transform: { x: "0", y: "0", width: "auto", height: "auto" },
    style: {},
    inputs: [],
    outputs: [],
    data: {},
    meta: {},
    ...overrides,
  };
}
