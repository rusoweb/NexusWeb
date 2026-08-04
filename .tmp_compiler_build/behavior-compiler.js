import { flattenTree } from "@nexusweb/core";
function compileOnClickHandler(nodeId, behavior) {
    const { action, targetId, url, customScript } = behavior;
    switch (action) {
        case "none":
            return "";
        case "navigate":
            return `window.location.href = ${url ? `"${url.replace(/"/g, '\\"')}"` : '""'};`;
        case "show":
            if (!targetId)
                return "";
            return `document.getElementById("${targetId}").style.display = "flex";`;
        case "hide":
            if (!targetId)
                return "";
            return `document.getElementById("${targetId}").style.display = "none";`;
        case "toggle":
            if (!targetId)
                return "";
            return `(function() {
  var el = document.getElementById("${targetId}");
  if (el) {
    el.style.display = el.style.display === "none" ? "flex" : "none";
  }
})();`;
        case "scrollTo":
            if (!targetId)
                return "";
            return `document.getElementById("${targetId}").scrollIntoView({ behavior: "smooth" });`;
        case "submit":
            return `(function() {
  var btn = document.getElementById("${nodeId}");
  if (btn) {
    var form = btn.closest("form");
    if (form) form.submit();
  }
})();`;
        case "custom":
            return customScript || "";
        default:
            return "";
    }
}
/**
 * Compile all node behaviors into a single <script> block.
 */
export function compileBehaviors(scene) {
    const allNodes = flattenTree(scene.rootId, scene.nodes);
    const handlerEntries = [];
    for (const node of allNodes) {
        const behavior = node.data?.behavior;
        if (!behavior?.onClick)
            continue;
        const handlerCode = compileOnClickHandler(node.id, behavior.onClick);
        if (!handlerCode)
            continue;
        handlerEntries.push(`    document.getElementById("${node.id}").addEventListener("click", function(e) {
      e.preventDefault();
      try {
        ${handlerCode}
      } catch (err) {
        console.error("NexusWeb behavior error for node ${node.id}:", err);
      }
    });`);
    }
    if (handlerEntries.length === 0) {
        return "";
    }
    return `<script>
(function() {
  function nexuswebInit() {
${handlerEntries.join("\n\n")}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", nexuswebInit);
  } else {
    nexuswebInit();
  }
})();
</script>`;
}
//# sourceMappingURL=behavior-compiler.js.map