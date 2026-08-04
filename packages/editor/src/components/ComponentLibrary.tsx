import { useMemo, useState } from "react";
import {
  Search,
  LayoutTemplate,
  Boxes,
  FileText,
  Sparkles,
} from "lucide-react";
import { useEditorStore } from "../store.ts";

const CATEGORY_ORDER = ["Layout", "Navigation", "Content", "Forms", "Media"];

function ComponentLibrary() {
  const componentLibrary = useEditorStore((s) => s.componentLibrary);
  const instantiateComponent = useEditorStore((s) => s.instantiateComponent);
  const saveAsComponent = useEditorStore((s) => s.saveAsComponent);
  const scene = useEditorStore((s) => s.scene);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredComponents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return componentLibrary.components.filter((component) => {
      const matchesCategory =
        activeCategory === "All" || component.category === activeCategory;
      const matchesSearch =
        !q ||
        component.name.toLowerCase().includes(q) ||
        component.description?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [componentLibrary.components, query, activeCategory]);

  const handleSaveSelection = () => {
    if (!selectedNodeId) return;
    const name =
      window.prompt("Component name", "NewComponent") ?? "NewComponent";
    const category = window.prompt("Category", "Layout") ?? "Layout";
    saveAsComponent(selectedNodeId, name, category);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 py-1.5 bg-nexus-panelAlt/60 border-b border-nexus-border flex items-center justify-between">
        <span className="text-xxs font-semibold uppercase tracking-wider text-nexus-muted">
          Components
        </span>
        <button
          className="text-xxs text-sky-400 hover:text-sky-300"
          onClick={handleSaveSelection}
          disabled={!selectedNodeId}
        >
          Save
        </button>
      </div>

      <div className="p-2 border-b border-nexus-border">
        <div className="flex items-center gap-2 bg-nexus-bg border border-nexus-border rounded px-2 py-1.5">
          <Search size={12} className="text-nexus-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components"
            className="flex-1 bg-transparent text-xs outline-none text-nexus-text"
          />
        </div>
      </div>

      <div className="flex gap-1 px-2 py-2 border-b border-nexus-border overflow-x-auto">
        {(["All", ...CATEGORY_ORDER] as string[]).map((category) => (
          <button
            key={category}
            className={`text-xxs px-2 py-1 rounded ${activeCategory === category ? "bg-sky-600 text-white" : "text-nexus-muted hover:bg-nexus-bg"}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredComponents.map((component) => (
          <button
            key={component.id}
            className="w-full text-left rounded border border-nexus-border bg-nexus-bg/70 p-2 hover:bg-nexus-border transition-colors"
            onClick={() =>
              scene && instantiateComponent(component.id, scene.rootId)
            }
            title={component.description}
            disabled={!scene}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-nexus-panel border border-nexus-border flex items-center justify-center text-nexus-muted">
                {component.category === "Forms" ? (
                  <FileText size={14} />
                ) : component.category === "Navigation" ? (
                  <LayoutTemplate size={14} />
                ) : component.category === "Media" ? (
                  <Boxes size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-nexus-text truncate">
                  {component.name}
                </div>
                <div className="text-xxs text-nexus-muted truncate">
                  {component.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { ComponentLibrary };
