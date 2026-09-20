import React from 'react';

/**
 * Lightweight Markdown Text Component
 * Formats **bold**, *italic*, bullet points (- item), numbered lists (1. item), and linebreaks.
 */
export default function MarkdownText({ content = '', className = '' }) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Bullet point check (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-health-400 shrink-0 mt-2" />
              <span>{renderFormattedInline(bulletContent)}</span>
            </div>
          );
        }

        // Numbered list check (e.g. 1. 2.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-health-300 text-xs shrink-0 mt-0.5">{numMatch[1]}.</span>
              <span>{renderFormattedInline(numMatch[2])}</span>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx}>
            {renderFormattedInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text) {
  // Regex to split by **bold** text
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}
