'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: Could not get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-950">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Chat with Claude 🤖
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Claude anything..."
            className="w-full p-4 border border-gray-700 rounded-lg mb-4 min-h-[100px] bg-gray-900 text-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking...' : 'Send Message'}
          </button>
        </form>

        {response && (
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="font-bold mb-2 text-white">Claude's Response:</h2>
            <p className="whitespace-pre-wrap text-gray-300">{response}</p>
          </div>
        )}
      </div>
    </main>
  );
}