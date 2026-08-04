import { useEffect } from "react";
import { useEditorStore } from "./store.ts";
import { Toolbar } from "./components/Toolbar.tsx";
import { SceneTree } from "./components/SceneTree.tsx";
import { ProjectPanel } from "./components/ProjectPanel.tsx";
import { ComponentLibrary } from "./components/ComponentLibrary.tsx";
import { Canvas } from "./components/Canvas.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { Layers, FolderTree, PanelRightClose, Component } from "lucide-react";

function App() {
  const loadScene = useEditorStore((s) => s.loadScene);
  const refreshPreview = useEditorStore((s) => s.refreshPreview);
  const scene = useEditorStore((s) => s.scene);

  useEffect(() => {
    // Load a demo scene on mount
    loadScene();
  }, [loadScene]);

  useEffect(() => {
    if (!scene) return;
    refreshPreview();
  }, [scene, refreshPreview]);

  return (
    <div className="h-screen w-screen flex flex-col bg-nexus-bg">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left dock column — Scene (top) + FileSystem (bottom) */}
        <div className="w-64 shrink-0 flex flex-col border-r border-nexus-border">
          <div className="g-dock flex-1">
            <div className="g-dock-header">
              <div className="flex items-center gap-1.5">
                <Layers size={11} className="text-nexus-muted" />
                <span className="g-dock-title">Scene</span>
              </div>
              <span className="text-xxs text-nexus-muted">
                {scene ? Object.keys(scene.nodes).length : 0} nodes
              </span>
            </div>
            <SceneTree />
          </div>
          <div className="h-px bg-nexus-border" />
          <div className="g-dock flex-1">
            <div className="g-dock-header">
              <div className="flex items-center gap-1.5">
                <FolderTree size={11} className="text-nexus-muted" />
                <span className="g-dock-title">FileSystem</span>
              </div>
            </div>
            <ProjectPanel />
          </div>
        </div>

        {/* Center — Canvas */}
        <Canvas />

        {/* Right dock column — Inspector (top) + Components (bottom) */}
        <div className="w-80 shrink-0 flex flex-col border-l border-nexus-border">
          <div className="g-dock flex-1">
            <div className="g-dock-header">
              <div className="flex items-center gap-1.5">
                <PanelRightClose size={11} className="text-nexus-muted" />
                <span className="g-dock-title">Inspector</span>
              </div>
            </div>
            <Inspector />
          </div>
          <div className="h-px bg-nexus-border" />
          <div className="g-dock flex-1">
            <div className="g-dock-header">
              <div className="flex items-center gap-1.5">
                <Component size={11} className="text-nexus-muted" />
                <span className="g-dock-title">Components</span>
              </div>
            </div>
            <ComponentLibrary />
          </div>
        </div>
      </div>
      {/* Status Bar */}
      <div className="h-6 bg-nexus-bg border-t border-nexus-border flex items-center px-3 gap-4 shrink-0 select-none">
        <span className="text-xxs text-nexus-muted">
          {scene ? scene.name : "No Scene"}
        </span>
        <span className="text-xxs text-nexus-muted">|</span>
        <span className="text-xxs text-nexus-muted">NexusWeb v0.1.0</span>
        <div className="flex-1" />
        <span className="text-xxs text-nexus-muted">Powered by Nodes</span>
      </div>
    </div>
  );
}

export default App;
