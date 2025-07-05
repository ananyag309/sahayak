"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateGame, type GenerateGameInput, type GenerateGameOutput } from "@/ai/flows/game-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic is required." }),
  grade: z.coerce.number().min(1).max(12),
});

export default function GamesPage() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [game, setGame] = useState<GenerateGameOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }

    setIsLoading(true);
    setGame(null);
    try {
      const input: GenerateGameInput = values;
      const result = await generateGame(input);
      setGame(result);
      
      if (db && user && !isDemoMode) {
        await addDoc(collection(db, "games"), {
            userId: user.uid,
            topic: values.topic,
            grade: values.grade,
            type: result.format,
            output: result.gameLogic,
            createdAt: serverTimestamp(),
        });
        toast({ title: "Game generated and saved!" });
      } else {
        toast({ title: "Game generated!" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to generate game.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.gameLogic);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    if (!game) return;
    const blob = new Blob([game.gameLogic], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game-logic.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Game Generator</h1>
          <p className="text-muted-foreground">Create fun quizzes and games for any topic.</p>
        </header>
        <Card>
          <CardHeader><CardTitle>Game Details</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl><Input placeholder="e.g., Indian States and Capitals" {...field} disabled={isLoading} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={`${i + 1}`}>{`Grade ${i + 1}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Game"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Game</h2>
          <p className="text-muted-foreground">Your game logic will appear here.</p>
        </header>
        <Card className="min-h-[400px] flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
            {game && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Format: {game.format}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-md border p-4 bg-muted">
                  <pre className="text-sm whitespace-pre-wrap font-sans">{game.gameLogic}</pre>
                </ScrollArea>
              </>
            )}
            {!isLoading && !game && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    Fill out the form to generate your game.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
