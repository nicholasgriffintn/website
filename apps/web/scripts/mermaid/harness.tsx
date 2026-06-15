import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { createMermaidDiagram } from "@tldraw/mermaid";
import { type Editor, type TLDefaultFontStyle, Tldraw, toRichText } from "tldraw";
import "tldraw/tldraw.css";

type RenderOptions = {
  padding: number;
};

type RenderResult = {
  svg: string;
};

declare global {
  interface Window {
    __tldrawEditor?: Editor;
    __tldrawReady?: Promise<void>;
    renderMermaid?: (source: string, options: RenderOptions) => Promise<RenderResult>;
  }
}

async function preloadFonts(editor: Editor) {
  const fonts: TLDefaultFontStyle[] = ["draw", "sans", "serif", "mono"];
  for (const font of fonts) {
    editor.createShape({
      type: "text",
      x: 0,
      y: 0,
      props: { richText: toRichText("Mgjpqy"), font },
    });
  }
  await editor.fonts.loadRequiredFontsForCurrentPage();
  await document.fonts.ready;
  editor.deleteShapes([...editor.getCurrentPageShapeIds()]);
}

function App() {
  return createElement(Tldraw, {
    hideUi: true,
    onMount(editor: Editor) {
      window.__tldrawEditor = editor;
      window.__tldrawReady = preloadFonts(editor);
    },
  });
}

createRoot(document.getElementById("root")!).render(createElement(App));

window.renderMermaid = async (source, options) => {
  const editor = window.__tldrawEditor;
  if (!editor) throw new Error("tldraw editor is not mounted");
  await window.__tldrawReady;

  const existingShapeIds = [...editor.getCurrentPageShapeIds()];
  if (existingShapeIds.length) editor.deleteShapes(existingShapeIds);

  await createMermaidDiagram(editor, source, {
    mermaidConfig: {
      theme: "dark",
    },
    blueprintRender: {
      position: { x: 0, y: 0 },
      centerOnPosition: false,
    },
    async onUnsupportedDiagram(svgString) {
      await editor.putExternalContent({ type: "svg-text", text: svgString });
    },
  });

  await editor.fonts.loadRequiredFontsForCurrentPage();

  const shapeIds = [...editor.getCurrentPageShapeIds()];
  if (!shapeIds.length) throw new Error("mermaid produced no shapes");

  const result = await editor.getSvgString(shapeIds, {
    padding: options.padding,
    background: false,
    darkMode: true,
  });
  if (!result) throw new Error("tldraw export produced no svg");

  return { svg: result.svg };
};
