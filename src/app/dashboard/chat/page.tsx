
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
import { Copy, Download, Loader2, Mic, Paperclip, Send, User, X, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  question: z.string(),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  isError?: boolean;
  inputData?: AIChatInput;
  isTyping?: boolean;
};

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isListening, setIsListening] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      language: "en",
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
        });
    }
  }, [messages]);

  useEffect(() => {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    form.setValue('question', form.getValues('question') + finalTranscript);
                }
            };
            
             recognition.onerror = (event: any) => {
                setIsListening(false);
                toast({
                    variant: 'destructive',
                    title: 'Speech Recognition Error',
                    description: event.error === 'not-allowed' ? 'Microphone access denied.' : `An error occurred: ${event.error}`,
                });
            };

            recognitionRef.current = recognition;
        }
    } catch (error) {
        console.error("Speech recognition is not supported in this browser.", error);
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [form, toast]);

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      if (isListening) {
        recognition.stop();
        setIsListening(false); 
      } else {
        try {
            const langMap = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN' };
            recognition.lang = langMap[form.getValues('language')];
            recognition.start();
        } catch (err) {
            console.error("Could not start speech recognition.", err);
            toast({ variant: 'destructive', title: 'Could not start listening.', description: 'Please try again.'});
        }
      }
    } else {
         toast({ variant: 'destructive', title: 'Feature Not Supported', description: 'Speech recognition is not available in your browser.'});
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

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

  const handleAiSubmission = async (input: AIChatInput, userMessageId: string) => {
    setIsSubmitting(true);
    const assistantTypingId = 'assistant-typing-indicator';

    const assistantTypingMessage: Message = {
      id: assistantTypingId,
      role: 'assistant',
      content: '',
      isTyping: true,
    };
    
    // Add typing indicator, and mark user message as not an error (for retries)
    setMessages(prev => [
      ...prev.map(m => m.id === userMessageId ? { ...m, isError: false } : m),
      assistantTypingMessage
    ]);

    try {
      const result = await aiChat(input);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.response,
      };
      
      // Replace the typing indicator with the actual response
      setMessages(prev => [
        ...prev.filter(m => m.id !== assistantTypingId),
        assistantMessage
      ]);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch response",
        description: "Please try again.",
      });
      // Mark the user's message as having an error and remove the typing indicator
      setMessages(prev =>
        prev.filter(m => m.id !== assistantTypingId)
          .map(m => m.id === userMessageId ? { ...m, isError: true } : m)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.question.trim() && !imageFile) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter a question or upload an image.' });
      return;
    }

    const input: AIChatInput = {
      question: values.question,
      language: values.language,
      imageDataUri: imagePreview ?? undefined,
    };
    
    // For new submissions, get a persistent URL for Firestore.
    let publicImageUrl: string | null = null;
    if (imageFile && user && user.uid !== 'demo-user' && storage && imagePreview) {
      const storageRef = ref(storage, `chatImages/${user.uid}/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadString(storageRef, imagePreview, 'data_url');
      publicImageUrl = await getDownloadURL(uploadResult.ref);
    }
    
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: values.question,
      imageUrl: imagePreview,
      inputData: input,
    };

    setMessages(prev => [...prev, userMessage]);
    form.reset({ ...form.getValues(), question: "" });
    removeImage();
    
    await handleAiSubmission(input, userMessageId);

    if (user && db) {
        addDoc(collection(db, "chatResponses"), {
            userId: user.uid,
            prompt: input.question,
            imageUrl: publicImageUrl,
            language: input.language,
            createdAt: serverTimestamp(),
            // Storing response is now tricky as it's not available here.
            // Consider logging prompt and getting response later or simplifying logging.
        }).catch(err => console.error("Error saving to Firestore", err));
    }
  }
  
  const handleRetry = (messageToRetry: Message) => {
    if (messageToRetry.inputData && messageToRetry.id) {
      handleAiSubmission(messageToRetry.inputData, messageToRetry.id);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Chat Assistant</h1>
        <p className="text-muted-foreground">Ask a question, upload an image, or use your voice to get a story, analogy, or simple explanation.</p>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
             <div className="space-y-6 p-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">No messages yet. Start by asking a question below.</div>
              )}
              {messages.map((message) => {
                if (message.isTyping) {
                  return (
                    <div key={message.id} className="flex items-start gap-4">
                      <Avatar className="bg-primary text-primary-foreground">
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-4 max-w-xl bg-muted flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex items-start gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
                    {message.role === "assistant" && (
                      <Avatar className="bg-primary text-primary-foreground">
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg p-4 max-w-xl ${message.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                      {message.imageUrl && (
                          <div className="mb-2 rounded-md overflow-hidden border">
                              <Image src={message.imageUrl} alt="User upload" width={300} height={300} className="object-cover" />
                          </div>
                      )}
                      {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                      
                      {message.role === "user" && message.isError && (
                          <div className="flex items-center gap-2 mt-2 text-destructive">
                             <AlertCircle className="h-4 w-4" />
                             <span>Failed to get response.</span>
                             <Button variant="ghost" size="sm" onClick={() => handleRetry(message)} disabled={isSubmitting}>
                                 <RefreshCw className="mr-2 h-4 w-4" />
                                 Retry
                             </Button>
                          </div>
                      )}

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
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            {imagePreview && (
                <div className="relative w-24 h-24 mb-2 rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={removeImage}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                 <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                    <Paperclip className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea placeholder="e.g., Explain what's happening in this image..." {...field} rows={1} className="min-h-[40px]" disabled={isSubmitting} />
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
                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isListening}>
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
                 <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isSubmitting} className={cn(isListening && 'bg-destructive text-destructive-foreground animate-pulse')}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="submit" size="icon" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
