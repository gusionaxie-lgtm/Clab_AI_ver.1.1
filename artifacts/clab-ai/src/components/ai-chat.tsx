import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Terminal, Bot, User, Loader2 } from "lucide-react";
import { 
  useGetOpenaiConversation, 
  useCreateOpenaiConversation, 
  useUpdateProject 
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface AiChatProps {
  projectId: number;
  initialConversationId?: number | null;
}

export default function AiChat({ projectId, initialConversationId }: AiChatProps) {
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId || null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversation, refetch: refetchConversation } = useGetOpenaiConversation(
    conversationId || 0, 
    { query: { enabled: !!conversationId } }
  );

  const createConversation = useCreateOpenaiConversation();
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
      scrollToBottom();
    }
  }, [conversation]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");

    // Create a temporary message for optimistic UI
    const tempUserMsg = { role: "user", content: userMessage, id: Date.now() };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsStreaming(true);

    try {
      let currentConvId = conversationId;

      // If no conversation exists, create one and link it to the project
      if (!currentConvId) {
        const newConv = await createConversation.mutateAsync({
          data: { title: `Project ${projectId} Discussion` }
        });
        currentConvId = newConv.id;
        setConversationId(currentConvId);
        
        // Link to project
        await updateProject.mutateAsync({
          id: projectId,
          data: { conversationId: currentConvId }
        });
      }

      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "", id: "streaming" }]);

      // Direct fetch for SSE streaming
      const response = await fetch(`/api/openai/conversations/${currentConvId}/messages?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.content) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.id === "streaming") {
                      lastMsg.content += data.content;
                    }
                    return newMessages;
                  });
                  scrollToBottom();
                }
                if (data.done) {
                  refetchConversation();
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1].id === "streaming") {
          newMsgs[newMsgs.length - 1].content = "Error connecting to strategist terminal.";
        }
        return newMsgs;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Card className="glass-card rounded-none border-border h-full flex flex-col">
      <CardHeader className="border-b border-border/50 py-3 px-4 bg-black/20">
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          CLAB_STRATEGIST
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground opacity-50 py-20">
              <Bot className="h-12 w-12" />
              <p className="text-sm font-mono">
                Strategist initialized.<br/>
                Ask for analysis, lore generation, or market strategy.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "h-8 w-8 rounded-sm flex items-center justify-center shrink-0 border",
                    msg.role === "user" 
                      ? "bg-secondary text-secondary-foreground border-secondary/50" 
                      : "bg-primary/10 text-primary border-primary/30 glow-green"
                  )}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "px-3 py-2 rounded-sm text-sm whitespace-pre-wrap font-mono",
                    msg.role === "user" 
                      ? "bg-secondary/50 border border-secondary/20" 
                      : "bg-black/40 border border-border/50 text-muted-foreground"
                  )}>
                    {msg.content}
                    {isStreaming && msg.id === "streaming" && (
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/50 bg-black/20">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the strategist..."
              className="flex-1 rounded-none border-border bg-black/40 font-mono text-xs focus-visible:ring-primary focus-visible:border-primary transition-all"
              disabled={isStreaming}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isStreaming}
              className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 glow-green shrink-0"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
