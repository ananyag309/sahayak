"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { aiChat, type AIChatInput } from "@/ai/flows/ai-chat-assistant";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, Loader2, Mic, Send, User } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  question: z.string().min(1, { message: "Please enter a question or concept." }),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      language: "en",
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-response.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started!" });
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You need to be logged in to chat with the assistant.",
      });
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: values.question }]);
    
    try {
      const input: AIChatInput = values;
      const result = await aiChat(input);
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      
      if (db && user && !isDemoMode) {
        await addDoc(collection(db, "chatResponses"), {
          userId: user.uid,
          prompt: values.question,
          response: result.response,
          language: values.language,
          createdAt: serverTimestamp(),
        });
      }

      form.reset({ ...values, question: "" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to get a response from the AI.",
      });
       setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Chat Assistant</h1>
        <p className="text-muted-foreground">Ask a question or enter a concept to get a story, analogy, or simple explanation.</p>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">No messages yet. Start by asking a question below.</div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <Avatar className="bg-primary text-primary-foreground">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-4 max-w-xl ${message.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(message.content)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar>
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea placeholder="e.g., Explain photosynthesis like I'm 10." {...field} rows={1} className="min-h-[40px]" disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                            <SelectItem value="mr">Marathi</SelectItem>
                            <SelectItem value="ta">Tamil</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <Button type="button" variant="outline" size="icon" disabled={isLoading}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="submit" size="icon" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
