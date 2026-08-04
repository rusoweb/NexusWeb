import { useEditorStore } from "../store.ts";
import type { Breakpoint, NodeBehavior } from "../store.ts";
import type { ComponentExport, NexusStyle } from "@nexusweb/core";

type NodeClickAction = NonNullable<NodeBehavior["onClick"]>["action"];

export function Inspector() {
  const scene = useEditorStore((s) => s.scene);
  const selectedId = useEditorStore((s) => s.selectedNodeId);
  const updateNodeStyle = useEditorStore((s) => s.updateNodeStyle);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const updateNodeBehavior = useEditorStore((s) => s.updateNodeBehavior);
  const renameNode = useEditorStore((s) => s.renameNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const componentLibrary = useEditorStore((s) => s.componentLibrary);
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);

  if (!selectedId || !scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-nexus-muted text-sm">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">👆</div>
          Select a node to edit
        </div>
      </div>
    );
  }

  const node = scene.nodes[selectedId];
  if (!node) return null;

  const style = node.style;
  const data = node.data;
  const behavior = (data.behavior ?? {}) as NodeBehavior;
  const contentCapableTypes = new Set([
    "text",
    "button",
    "link",
    "input",
    "textarea",
    "select",
  ]);
  const showContentSection =
    contentCapableTypes.has(node.type) ||
    data.content !== undefined ||
    data.text !== undefined ||
    data.placeholder !== undefined ||
    data.value !== undefined;
  const contentValue =
    (typeof data.content === "string" && data.content) ||
    (typeof data.text === "string" && data.text) ||
    (typeof data.placeholder === "string" && data.placeholder) ||
    (typeof data.value === "string" && data.value) ||
    "";
  const onClick = behavior.onClick ?? { action: "none" };
  const responsive = (node.responsive ?? {}) as Record<
    Breakpoint,
    Partial<NexusStyle> | undefined
  >;
  const componentRef = node.data.componentRef;
  const component = componentLibrary.components.find(
    (entry) => entry.id === componentRef,
  );
  const instanceProps = (node.data.props ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Node identity header */}
      <div className="px-3 py-2 bg-nexus-panelAlt/60 border-b border-nexus-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-sky-500" />
          <span className="text-xxs font-semibold uppercase tracking-wide text-nexus-muted">
            {node.name || "Node"}
          </span>
        </div>
        <span className="text-xxs text-nexus-muted font-mono">
          {node.id.slice(0, 8)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Identity */}
        <Section title="Node">
          <Field label="Name">
            <input
              value={node.name}
              onChange={(e) => renameNode(node.id, e.target.value)}
              className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
            />
          </Field>
          <Field label="Type">
            <input
              value={node.type}
              readOnly
              className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-muted opacity-60 cursor-not-allowed"
            />
          </Field>
        </Section>

        {component && (
          <Section title="Instance Properties">
            {component.exports.map((exportItem: ComponentExport) => {
              const value =
                instanceProps[exportItem.name] ?? exportItem.defaultValue ?? "";
              const renderInput = () => {
                switch (exportItem.type) {
                  case "number":
                    return (
                      <input
                        type="number"
                        value={String(value ?? "")}
                        onChange={(e) =>
                          updateNodeProps(node.id, {
                            [exportItem.name]: Number(e.target.value),
                          })
                        }
                        className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
                      />
                    );
                  case "boolean":
                    return (
                      <label className="flex items-center gap-2 text-xs text-nexus-text">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) =>
                            updateNodeProps(node.id, {
                              [exportItem.name]: e.target.checked,
                            })
                          }
                        />
                        {exportItem.label}
                      </label>
                    );
                  case "enum":
                    return (
                      <select
                        value={String(value ?? "")}
                        onChange={(e) =>
                          updateNodeProps(node.id, {
                            [exportItem.name]: e.target.value,
                          })
                        }
                        className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
                      >
                        {(exportItem.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    );
                  case "color":
                    return (
                      <input
                        type="color"
                        value={String(value ?? "#000000")}
                        onChange={(e) =>
                          updateNodeProps(node.id, {
                            [exportItem.name]: e.target.value,
                          })
                        }
                        className="w-10 h-8"
                      />
                    );
                  default:
                    return (
                      <input
                        value={String(value ?? "")}
                        onChange={(e) =>
                          updateNodeProps(node.id, {
                            [exportItem.name]: e.target.value,
                          })
                        }
                        className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
                      />
                    );
                }
              };
              return (
                <Field key={exportItem.name} label={exportItem.label}>
                  {renderInput()}
                </Field>
              );
            })}
          </Section>
        )}

        {/* Content */}
        {showContentSection && (
          <Section title="Content">
            <Field
              label={
                node.type === "text"
                  ? "Text Content"
                  : node.type === "button"
                    ? "Button Label"
                    : node.type === "link"
                      ? "Link Text"
                      : "Content"
              }
            >
              <input
                value={contentValue}
                onChange={(e) => {
                  if (node.type === "text") {
                    updateNodeData(node.id, { content: e.target.value });
                  } else if (node.type === "button" || node.type === "link") {
                    updateNodeData(node.id, { text: e.target.value });
                  } else if (node.type === "input") {
                    updateNodeData(node.id, { placeholder: e.target.value });
                  } else if (
                    node.type === "textarea" ||
                    node.type === "select"
                  ) {
                    updateNodeData(node.id, { placeholder: e.target.value });
                  }
                }}
                className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
              />
            </Field>
          </Section>
        )}

        {/* Transform */}
        <Section title="Transform">
          <div className="grid grid-cols-2 gap-2">
            <ReadOnlyField label="X" value={node.transform.x} />
            <ReadOnlyField label="Y" value={node.transform.y} />
          </div>
          <ReadOnlyField label="Width" value={node.transform.width} />
          <ReadOnlyField label="Height" value={node.transform.height} />
        </Section>

        {/* Layout */}
        <Section title="Layout">
          <StyleField
            label="Padding"
            value={(style.padding as string) ?? "0"}
            onChange={(v) => updateNodeStyle(node.id, { padding: v })}
          />
          <StyleField
            label="Margin"
            value={(style.margin as string) ?? "0"}
            onChange={(v) => updateNodeStyle(node.id, { margin: v })}
          />
          <StyleField
            label="Display"
            value={style.display ?? "block"}
            onChange={(v) => updateNodeStyle(node.id, { display: v as any })}
          />
          <StyleField
            label="Gap"
            value={style.gap ?? "0"}
            onChange={(v) => updateNodeStyle(node.id, { gap: v })}
          />
          <StyleField
            label="Flex Direction"
            value={style.flexDirection ?? "row"}
            onChange={(v) =>
              updateNodeStyle(node.id, { flexDirection: v as any })
            }
          />
          <StyleField
            label="Justify Content"
            value={style.justifyContent ?? "flex-start"}
            onChange={(v) =>
              updateNodeStyle(node.id, { justifyContent: v as any })
            }
          />
          <StyleField
            label="Align Items"
            value={style.alignItems ?? "stretch"}
            onChange={(v) => updateNodeStyle(node.id, { alignItems: v as any })}
          />
          <StyleField
            label="Text Align"
            value={style.textAlign ?? "left"}
            onChange={(v) => updateNodeStyle(node.id, { textAlign: v as any })}
          />
          <StyleField
            label="Overflow"
            value={style.overflow ?? "visible"}
            onChange={(v) => updateNodeStyle(node.id, { overflow: v as any })}
          />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <ColorField
            label="Background"
            value={style.backgroundColor ?? "#252526"}
            onChange={(v) => updateNodeStyle(node.id, { backgroundColor: v })}
          />
          <ColorField
            label="Text Color"
            value={style.color ?? "#cccccc"}
            onChange={(v) => updateNodeStyle(node.id, { color: v })}
          />
          <StyleField
            label="Font Size"
            value={style.fontSize ?? "16px"}
            onChange={(v) => updateNodeStyle(node.id, { fontSize: v })}
          />
          <StyleField
            label="Font Family"
            value={style.fontFamily ?? ""}
            onChange={(v) => updateNodeStyle(node.id, { fontFamily: v })}
            placeholder="e.g. Inter, Arial, sans-serif"
          />
          <StyleField
            label="Line Height"
            value={String(style.lineHeight ?? "")}
            onChange={(v) => updateNodeStyle(node.id, { lineHeight: v as any })}
            placeholder="e.g. 1.5, 24px"
          />
          <StyleField
            label="Letter Spacing"
            value={String((style as any).letterSpacing ?? "")}
            onChange={(v) =>
              updateNodeStyle(node.id, { letterSpacing: v as any } as any)
            }
            placeholder="e.g. 0.02em"
          />
          <StyleField
            label="Text Transform"
            value={String((style as any).textTransform ?? "none")}
            onChange={(v) =>
              updateNodeStyle(node.id, { textTransform: v as any } as any)
            }
            placeholder="none | uppercase | lowercase | capitalize"
          />
          <StyleField
            label="Border Radius"
            value={style.borderRadius ?? "0"}
            onChange={(v) => updateNodeStyle(node.id, { borderRadius: v })}
          />
          <StyleField
            label="Border Width"
            value={style.borderWidth ?? "0"}
            onChange={(v) => updateNodeStyle(node.id, { borderWidth: v })}
          />
          <ColorField
            label="Border Color"
            value={style.borderColor ?? "#3e3e42"}
            onChange={(v) => updateNodeStyle(node.id, { borderColor: v })}
          />
          <StyleField
            label="Box Shadow"
            value={style.boxShadow ?? ""}
            onChange={(v) => updateNodeStyle(node.id, { boxShadow: v })}
            placeholder="e.g. 0 4px 12px rgba(0,0,0,0.12)"
          />
          <StyleField
            label="Cursor"
            value={style.cursor ?? "auto"}
            onChange={(v) => updateNodeStyle(node.id, { cursor: v as any })}
            placeholder="e.g. pointer, grab"
          />
          <StyleField
            label="Opacity"
            value={style.opacity !== undefined ? String(style.opacity) : "1"}
            onChange={(v) =>
              updateNodeStyle(node.id, { opacity: parseFloat(v) })
            }
          />
        </Section>

        {/* Responsive Override */}
        <Section title={`Responsive — ${activeBreakpoint}`}>
          <div className="text-xxs text-nexus-muted mb-2">
            These styles apply only on {activeBreakpoint}.
          </div>
          <StyleField
            label="Font Size Override"
            value={responsive[activeBreakpoint]?.fontSize ?? ""}
            onChange={(v) => {
              const nextResponsive = { ...responsive };
              nextResponsive[activeBreakpoint] = {
                ...(nextResponsive[activeBreakpoint] ?? {}),
                fontSize: v || undefined,
              };
              updateNodeStyle(node.id, { responsive: nextResponsive } as any);
            }}
            placeholder="e.g. 14px"
          />
          <StyleField
            label="Padding Override"
            value={(responsive[activeBreakpoint]?.padding as string) ?? ""}
            onChange={(v) => {
              const nextResponsive = { ...responsive };
              nextResponsive[activeBreakpoint] = {
                ...(nextResponsive[activeBreakpoint] ?? {}),
                padding: v || undefined,
              };
              updateNodeStyle(node.id, { responsive: nextResponsive } as any);
            }}
            placeholder="e.g. 8px"
          />
        </Section>

        {/* Behavior */}
        <Section title="Behavior">
          <Field label="On Click">
            <select
              value={onClick.action}
              onChange={(e) =>
                updateNodeBehavior(node.id, {
                  onClick: {
                    ...onClick,
                    action: e.target.value as NodeClickAction,
                  },
                })
              }
              className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
            >
              <option value="none">None</option>
              <option value="navigate">Navigate to URL</option>
              <option value="show">Show Element</option>
              <option value="hide">Hide Element</option>
              <option value="toggle">Toggle Element</option>
              <option value="scrollTo">Scroll to Section</option>
              <option value="submit">Submit Form</option>
              <option value="custom">Custom Script</option>
            </select>
          </Field>

          {onClick.action === "navigate" && (
            <StyleField
              label="URL"
              value={onClick.url ?? ""}
              onChange={(v) =>
                updateNodeBehavior(node.id, {
                  onClick: {
                    ...onClick,
                    url: v,
                  },
                })
              }
            />
          )}

          {(onClick.action === "show" ||
            onClick.action === "hide" ||
            onClick.action === "toggle" ||
            onClick.action === "scrollTo") && (
            <StyleField
              label="Target Element ID"
              value={onClick.targetId ?? ""}
              onChange={(v) =>
                updateNodeBehavior(node.id, {
                  onClick: {
                    ...onClick,
                    targetId: v,
                  },
                })
              }
            />
          )}

          {onClick.action === "custom" && (
            <Field label="Custom Script">
              <textarea
                value={onClick.customScript ?? ""}
                onChange={(e) =>
                  updateNodeBehavior(node.id, {
                    onClick: {
                      ...onClick,
                      customScript: e.target.value,
                    },
                  })
                }
                rows={3}
                className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors font-mono"
                placeholder="// JavaScript here"
              />
            </Field>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-nexus-border/50 last:border-0">
      <div className="g-section-header">
        <span className="g-section-title">{title}</span>
      </div>
      <div className="p-3 space-y-2.5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xxs font-medium text-nexus-muted mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function StyleField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
      />
    </Field>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <input
        value={value}
        readOnly
        className="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-muted opacity-60 cursor-not-allowed"
      />
    </Field>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <div className="relative w-6 h-6 rounded overflow-hidden border border-nexus-border shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-1 -left-1 w-8 h-8 p-0 border-0 cursor-pointer"
          />
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-sky-600 transition-colors"
        />
      </div>
    </Field>
  );
}
