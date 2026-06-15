import React from "react";

export function getTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextFromReactNode(child)).join("");
  }

  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return getTextFromReactNode(props.children);
  }

  return "";
}
