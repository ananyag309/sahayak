"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateDiagram, type GenerateDiagramInput } from "@/ai/flows/diagram-generator";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Download, Loader2, Save } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

export default function DiagramPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setDiagramUrl(null);
    setCurrentTopic(values.topic);
    try {
      const input: GenerateDiagramInput = { topic: values.topic };
      const result = await generateDiagram(input);
      setDiagramUrl(result.diagramUrl);
      toast({ title: "Diagram generated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to generate diagram.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveDiagram = async () => {
    if (!diagramUrl || !user || !currentTopic) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "diagrams"), {
        userId: user.uid,
        topic: currentTopic,
        diagramUrl: diagramUrl,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Diagram saved to your collection!" });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Could not save diagram to Firestore.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <div>
            <header className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Diagram Generator</h1>
                <p className="text-muted-foreground">Enter a topic to generate a chalkboard-style diagram.</p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Create Diagram</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                            control={form.control}
                            name="topic"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Topic or Concept</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., The Water Cycle" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Diagram"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
        <div>
            <header className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Diagram</h2>
                <p className="text-muted-foreground">Your diagram will appear here.</p>
            </header>
            <Card className="min-h-[400px] flex items-center justify-center">
                 {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary"/>}
                 {!isLoading && diagramUrl && (
                    <CardContent className="p-6 w-full">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                            <Image src={diagramUrl} alt={`Diagram of ${currentTopic}`} layout="fill" objectFit="contain" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button className="flex-1" asChild>
                                <a href={diagramUrl} download={`diagram-${currentTopic?.replace(/\s+/g, '-')}.png`}>
                                    <Download className="mr-2 h-4 w-4"/> Download
                                </a>
                            </Button>
                            <Button className="flex-1" variant="outline" onClick={handleSaveDiagram} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Save to Collection
                            </Button>
                        </div>
                    </CardContent>
                 )}
                {!isLoading && !diagramUrl && (
                    <p className="text-muted-foreground text-center p-4">Enter a topic and click "Generate" to see your diagram.</p>
                )}
            </Card>
        </div>
    </div>
  );
}
