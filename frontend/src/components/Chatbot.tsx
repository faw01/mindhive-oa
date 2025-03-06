'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

// Define types for tool invocations
interface ToolResults {
  relevantOutlets?: RelevantOutlet[];
  outlets?: { length: number }[];
  outlet?: { name: string };
  count?: number;
  radius?: number;
}

interface ToolInvocation {
  toolName: string;
  toolResults?: ToolResults;
}

interface RelevantOutlet {
  name: string;
  similarity: number;
}

interface ChatbotProps {
  embedded?: boolean;
}

export default function Chatbot({ embedded = false }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(!embedded); // Always open if embedded
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 5, // Enable multi-step tool calls
  });

  const toggleChat = () => {
    if (!embedded) {
      setIsOpen(!isOpen);
    }
  };

  // Helper to format tool results for display
  const formatToolResults = (toolInvocations: ToolInvocation[]) => {
    if (!toolInvocations) return null;
    
    const invocation = toolInvocations[0];
    
    // Handle different tool types
    if (invocation.toolName === 'retrieveOutletInfo') {
      const { relevantOutlets = [] } = invocation.toolResults || { relevantOutlets: [] };
      
      if (relevantOutlets.length === 0) {
        return <span className="italic text-xs">No relevant outlets found</span>;
      }
      
      return (
        <div className="text-xs">
          <p className="font-semibold">Found matching outlets:</p>
          {relevantOutlets.map((outlet: RelevantOutlet, index: number) => (
            <div key={index} className="mt-1">
              <p className="font-medium">{outlet.name} (Match: {outlet.similarity})</p>
            </div>
          ))}
        </div>
      );
    }
    
    if (invocation.toolName === 'getOutlets') {
      const { outlets = [] } = invocation.toolResults || { outlets: [] };
      return (
        <div className="text-xs">
          <p className="italic">Found {outlets.length} outlets</p>
        </div>
      );
    }
    
    if (invocation.toolName === 'getOutletDetails') {
      const { outlet = { name: 'unknown' } } = invocation.toolResults || { outlet: { name: 'unknown' } };
      if (!outlet) return <span className="italic text-xs">No outlet details found</span>;
      
      return (
        <div className="text-xs">
          <p className="italic">Retrieved details for {outlet.name}</p>
        </div>
      );
    }
    
    if (invocation.toolName === 'findNearbyOutlets') {
      const { count = 0, radius = 0 } = invocation.toolResults || { count: 0, radius: 0 };
      return (
        <div className="text-xs">
          <p className="italic">Found {count} outlets within {radius}km</p>
        </div>
      );
    }
    
    return <span className="italic text-xs">Using {invocation.toolName}...</span>;
  };

  // If embedded, show a simplified version
  if (embedded) {
    return (
      <div className="w-full">
        <div className="h-48 border rounded-md bg-background mb-4 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              <p>👋 Hi! I can help you find Subway outlets and answer your questions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-[#f2b700] text-black'
                          : 'bg-[#028938] text-white'
                      }`}
                    >
                      {message.content ? (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      ) : (
                        <div className="text-xs italic">
                          {message.toolInvocations
                            ? formatToolResults(message.toolInvocations)
                            : 'Thinking...'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 max-w-[80%] bg-[#028938] text-white">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-white/50 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-white/50 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-white/50 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <form 
          onSubmit={handleSubmit}
          className="flex w-full gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-[#028938] text-white hover:bg-[#028938]/90 h-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M22 2L11 13"></path>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </Button>
        </form>
      </div>
    );
  }

  // Otherwise show the floating chat interface
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-80 sm:w-96 shadow-lg mb-4 border-primary/10">
          <CardHeader className="bg-primary/5 px-4 py-2 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Image 
                src="/subway-logo.svg" 
                alt="Subway Logo" 
                width={80} 
                height={16} 
                className="h-4 w-auto"
              />
              <span className="ml-2">Subway Assistant</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  <p>👋 Hi there! I&apos;m your Subway assistant.</p>
                  <p className="mt-2">Ask me about:</p>
                  <ul className="mt-1 text-sm">
                    <li>• Subway outlets in Kuala Lumpur</li>
                    <li>• Operating hours</li>
                    <li>• Finding nearby outlets</li>
                    <li>• Directions to outlets</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {messages.map((message) => {
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 max-w-[80%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content ? (
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                          ) : (
                            <div className="text-xs italic">
                              {message.toolInvocations
                                ? formatToolResults(message.toolInvocations)
                                : 'Thinking...'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-lg px-3 py-2 max-w-[80%] bg-muted">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-75"></div>
                          <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <form 
              onSubmit={handleSubmit}
              className="flex w-full gap-2"
            >
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="px-3 bg-[#028938] text-white hover:bg-[#028938]/90 h-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                </svg>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
      <Button
        onClick={toggleChat}
        className="rounded-full w-12 h-12 shadow-lg p-0 flex items-center justify-center"
      >
        {!isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </Button>
    </div>
  );
} 