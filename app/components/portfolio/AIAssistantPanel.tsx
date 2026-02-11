'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Link as LinkIcon, X, File, Loader2, Sparkles } from 'lucide-react';
import { useNotification } from '@/app/hooks/useNotification';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Attachment {
  name: string;
  type: string;
  contentType: 'text' | 'image';
  content: string;
  size: number;
}

interface AIAssistantPanelProps {
  markdown: string;
  onMarkdownUpdate: (markdown: string) => void;
}

export function AIAssistantPanel({ markdown, onMarkdownUpdate }: AIAssistantPanelProps) {
  const { showError } = useNotification();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey there! 👋 I'm your portfolio AI assistant.\n\nI can help you build your portfolio by:\n• Processing your resume, certificates, or documents\n• Extracting info from links (LinkedIn, GitHub, articles)\n• Analyzing images and screenshots\n• Writing compelling content about your work\n\nJust upload files, paste links, or tell me what to add!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/portfolio/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setPendingAttachments((prev) => [...prev, data.file]);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `📎 File attached: ${data.file.name} (${(data.file.size / 1024).toFixed(1)}KB) - Ready to process`,
          },
        ]);
      } else {
        showError(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      showError('Failed to upload file');
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading) return;

    const userMessage = input.trim();
    const attachments = [...pendingAttachments];
    
    setInput('');
    setPendingAttachments([]);
    
    // Show user message
    let displayMessage = userMessage;
    if (attachments.length > 0) {
      displayMessage += `\n\n📎 ${attachments.length} file(s) attached`;
    }
    
    setMessages((prev) => [...prev, { role: 'user', content: displayMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/portfolio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          attachments,
          currentMarkdown: markdown,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
        
        // Update markdown if AI suggests changes
        if (data.updatedMarkdown) {
          onMarkdownUpdate(data.updatedMarkdown);
          setMessages((prev) => [
            ...prev,
            { role: 'system', content: '✅ Portfolio markdown updated! Check the editor.' },
          ]);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Upload files, paste links, or chat</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-accent text-white'
                    : message.role === 'system'
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 text-sm'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        {/* Attachments */}
        {pendingAttachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingAttachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{attachment.name}</span>
                <button
                  onClick={() =>
                    setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Tell me what to add, upload files, or paste links..."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
            rows={3}
            disabled={loading || uploadProgress}
          />
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadProgress}
                className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                title="Upload file"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || uploadProgress || (!input.trim() && pendingAttachments.length === 0)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
