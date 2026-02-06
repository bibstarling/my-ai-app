'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3,
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Sparkles,
  Save
} from 'lucide-react';

interface WYSIWYGEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'code';

export function WYSIWYGEditor({ markdown, onChange, onSave, isSaving }: WYSIWYGEditorProps) {
  const [content, setContent] = useState(markdown);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (value: string) => {
    setContent(value);
    onChange(value);
  };

  const insertFormatting = (prefix: string, suffix: string = '', newLine: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    let newText;
    if (newLine) {
      // For headers, quotes, etc - add at start of line
      const lineStart = beforeText.lastIndexOf('\n') + 1;
      const lineText = beforeText.substring(lineStart);
      newText = content.substring(0, lineStart) + prefix + lineText + content.substring(start);
    } else {
      newText = beforeText + prefix + selectedText + suffix + afterText;
    }

    handleContentChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      if (newLine) {
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + selectedText.length;
      }
      textarea.focus();
    }, 0);
  };

  const formatActions = [
    { icon: Heading1, label: 'Title', action: () => insertFormatting('# ', '', true) },
    { icon: Heading2, label: 'Heading', action: () => insertFormatting('## ', '', true) },
    { icon: Heading3, label: 'Subheading', action: () => insertFormatting('### ', '', true) },
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('_', '_') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('- ', '', true) },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('1. ', '', true) },
    { icon: Quote, label: 'Quote', action: () => insertFormatting('> ', '', true) },
    { icon: Code, label: 'Code', action: () => insertFormatting('`', '`') },
  ];

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertFormatting('**', '**');
    }
    // Cmd/Ctrl + I for italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertFormatting('_', '_');
    }
    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ');
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {formatActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={action.label}
              >
                <action.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Save Portfolio
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-8">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-screen w-full resize-none border-none bg-transparent text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="# Start with a title...

## About Me
Write about yourself...

## Experience
### Job Title @ Company
*Jan 2023 - Present*

Describe your role...

**Key Achievements:**
- First achievement
- Second achievement

Use **bold** for emphasis, _italic_ for style, and `code` for technical terms."
              spellCheck={true}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="hidden w-1/2 overflow-auto border-l border-border bg-muted/30 lg:block">
          <div className="mx-auto max-w-3xl p-8">
            <div className="prose prose-slate max-w-none">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Preview</h3>
              <div 
                className="markdown-preview"
                dangerouslySetInnerHTML={{ 
                  __html: convertMarkdownToHTML(content) 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border bg-muted px-6 py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{content.length.toLocaleString()} characters</span>
            <span>{content.split('\n').length.toLocaleString()} lines</span>
            <span>{content.split(/\s+/).filter(w => w).length.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">
              Press <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">Cmd/Ctrl+B</kbd> for bold, 
              <kbd className="ml-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono">Cmd/Ctrl+I</kbd> for italic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown to HTML converter for preview
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic
  html = html.replace(/\_(.*?)\_/g, '<em class="italic">$1</em>');
  
  // Code
  html = html.replace(/`(.*?)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-accent hover:underline">$1</a>');
  
  // Bullet lists
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-1 my-3">$1</ul>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-accent pl-4 italic my-3">$1</blockquote>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = '<p class="my-3">' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="my-3"><\/p>/g, '');

  return html;
}
