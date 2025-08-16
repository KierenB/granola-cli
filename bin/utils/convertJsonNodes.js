"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNodeToMarkdown = convertNodeToMarkdown;
exports.convertDocumentToMarkdown = convertDocumentToMarkdown;
function convertNodeToMarkdown(node) {
    if (!node)
        return "";
    const newLine = `\n\n`;
    switch (node.type) {
        case "paragraph":
            return (node.content?.map(convertNodeToMarkdown).join(" ") || "") + newLine;
        case "heading":
            return `${"#".repeat(node.attrs?.level || 1)} ${node.content?.map(convertNodeToMarkdown).join(" ")} ${newLine}`;
        case "bulletList":
            return (node.content?.map(convertNodeToMarkdown).join("") || "") + newLine;
        case "listItem":
            return `- ${node.content?.map(convertNodeToMarkdown).join(" ")} ${newLine}`;
        case "text":
            return node.text || "";
        case "horizontalRule":
            return "--- " + newLine;
        case "doc":
            return node.content ? node.content.map(convertNodeToMarkdown).join("") : "";
        default:
            return "";
    }
}
function convertDocumentToMarkdown(content) {
    if (!content)
        return "";
    // Handle the new document structure
    if (content.type === "doc") {
        return convertNodeToMarkdown(content);
    }
    // Fallback for the old structure with attachments
    if (Array.isArray(content.attachments)) {
        return content.attachments
            .map((attachment) => {
            const parsedContent = JSON.parse(attachment.content);
            return convertNodeToMarkdown(parsedContent);
        })
            .join(" \n\n ");
    }
    return "";
}
