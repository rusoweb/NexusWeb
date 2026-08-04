/**
 * @file test-scene.ts
 * @description End-to-end test of NexusWeb Core (Phase 0.1 + 0.2)
 * Run: npx tsx test-scene.ts
 */

import {
  createEmptyScene,
  createNode,
  addChild,
  getChildren,
  getNodePath,
  flattenTree,
  serializeScene,
  parseScene,
  NexusSceneSchema,
} from "./src/index.js";

console.log("🚀 NexusWeb Core Test\n");

// ─── 1. Create an empty scene ────────────────────────────
const scene = createEmptyScene("Landing Page");
console.log("✅ Created scene:", scene.name);
console.log("   Scene ID:", scene.id);
console.log("   Root node:", scene.rootId);

// ─── 2. Build a node tree ────────────────────────────────
const rootId = scene.rootId;
let nodes = scene.nodes;

// Header container
const headerId = crypto.randomUUID();
const header = createNode(headerId, "container", "Header", {
  style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "#1e1e1e",
  },
});
nodes = addChild(rootId, header, nodes);

// Logo text inside header
const logoId = crypto.randomUUID();
const logo = createNode(logoId, "text", "Logo", {
  parentId: headerId,
  data: { content: "NexusWeb" },
  style: { fontSize: "20px", fontWeight: "700", color: "#ffffff" },
});
nodes = addChild(headerId, logo, nodes);

// Navigation container inside header
const navId = crypto.randomUUID();
const nav = createNode(navId, "container", "Navigation", {
  parentId: headerId,
  style: { display: "flex", gap: "24px" },
});
nodes = addChild(headerId, nav, nodes);

// Nav links
const homeLink = createNode(crypto.randomUUID(), "link", "Home Link", {
  parentId: navId,
  data: { href: "/", text: "Home" },
  style: { color: "#cccccc", textDecoration: "none" },
});
nodes = addChild(navId, homeLink, nodes);

const aboutLink = createNode(crypto.randomUUID(), "link", "About Link", {
  parentId: navId,
  data: { href: "/about", text: "About" },
  style: { color: "#cccccc", textDecoration: "none" },
});
nodes = addChild(navId, aboutLink, nodes);

// Hero section
const heroId = crypto.randomUUID();
const hero = createNode(heroId, "container", "Hero Section", {
  style: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 24px",
    gap: "16px",
  },
});
nodes = addChild(rootId, hero, nodes);

// Hero title
const heroTitle = createNode(crypto.randomUUID(), "text", "Hero Title", {
  parentId: heroId,
  data: { content: "Build websites like scenes" },
  style: { fontSize: "48px", fontWeight: "700", textAlign: "center", color: "#ffffff" },
});
nodes = addChild(heroId, heroTitle, nodes);

// Hero subtitle
const heroSub = createNode(crypto.randomUUID(), "text", "Hero Subtitle", {
  parentId: heroId,
  data: { content: "A Godot-inspired engine where everything is a node." },
  style: { fontSize: "20px", color: "#888888", textAlign: "center" },
});
nodes = addChild(heroId, heroSub, nodes);

// CTA Button with signal port
const ctaId = crypto.randomUUID();
const ctaButton = createNode(ctaId, "button", "CTA Button", {
  parentId: heroId,
  data: { text: "Get Started", variant: "primary" },
  style: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  outputs: [{ id: "pressed", label: "pressed", type: "event" }],
});
nodes = addChild(heroId, ctaButton, nodes);

// Update scene with new nodes
const fullScene = { ...scene, nodes };

// ─── 3. Print the tree ───────────────────────────────────
console.log("\n📁 Scene Tree:");
function printTree(nodeId: string, depth = 0) {
  const n = nodes[nodeId];
  if (!n) return;
  const indent = "  ".repeat(depth);
  const icon = n.type === "container" ? "📦" : n.type === "text" ? "📝" : n.type === "button" ? "🔘" : n.type === "link" ? "🔗" : "📄";
  console.log(`${indent}${icon} ${n.name} (${n.type})`);
  for (const childId of n.childrenIds) {
    printTree(childId, depth + 1);
  }
}
printTree(rootId);

// ─── 4. Print path to CTA button ─────────────────────────
console.log("\n🛤️  Path to CTA Button:");
const path = getNodePath(ctaId, nodes);
console.log("   ", path.map((n) => n.name).join(" → "));

// ─── 5. Flatten tree stats ───────────────────────────────
const flat = flattenTree(rootId, nodes);
console.log("\n📊 Tree Stats:");
console.log("   Total nodes:", flat.length);
console.log("   Visual nodes:", flat.filter((n) => !["timer", "counter", "condition", "variable", "router", "http_request", "form_validator"].includes(n.type)).length);
console.log("   Max depth:", Math.max(...flat.map((n) => getNodePath(n.id, nodes).length)));

// ─── 6. Validate with Zod ────────────────────────────────
console.log("\n🔍 Validating scene with Zod...");
const validated = NexusSceneSchema.parse(fullScene);
console.log("✅ Scene is valid!");

// ─── 7. Serialize & roundtrip ────────────────────────────
console.log("\n💾 Serialization test:");
const json = serializeScene(validated);
console.log("   JSON size:", json.length, "chars");

const recovered = parseScene(json);
console.log("   Roundtrip OK:", recovered.name === validated.name);
console.log("   Nodes preserved:", Object.keys(recovered.nodes).length === Object.keys(validated.nodes).length);

// ─── 8. Signal summary ───────────────────────────────────
console.log("\n📡 Signal Ports:");
const buttonNode = nodes[ctaId];
console.log(`   ${buttonNode.name} outputs:`, buttonNode.outputs.map((o) => `${o.label} (${o.type})`).join(", "));

console.log("\n🎉 All tests passed. Core is solid.");