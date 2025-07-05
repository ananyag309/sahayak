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
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Download, Loader2, Save, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

export default function DiagramPage() {
  const { user, isDemoMode } = useAuth();
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
    if (isDemoMode) {
      toast({
        variant: "destructive",
        title: "Demo Mode",
        description: "This feature is disabled in Demo Mode.",
      });
      return;
    }
    if (!user || !storage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and Firebase Storage must be configured.",
      });
      return;
    }
    setIsLoading(true);
    setDiagramUrl(null);
    setCurrentTopic(values.topic);

    try {
      const input: GenerateDiagramInput = { topic: values.topic };
      const result = await generateDiagram(input);
      const dataUri = result.diagramDataUri;

      const fetchRes = await fetch(dataUri);
      const blob = await fetchRes.blob();

      const storageRef = ref(storage, `diagrams/${user.uid}/${values.topic.replace(/\s+/g, '_')}-${Date.now()}.png`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setDiagramUrl(downloadURL);
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
    if (!diagramUrl || !user || !currentTopic || !db) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Missing data or Firebase connection. Please try again.",
      });
      return;
    }
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
                    {isDemoMode && (
                        <Alert className="mb-4">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Demo Mode</AlertTitle>
                            <AlertDescription>
                            This feature is disabled because it requires a connection to AI services and Firebase Storage. Please sign in with a real account to generate and save diagrams.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                            control={form.control}
                            name="topic"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Topic or Concept</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., The Water Cycle" {...field} disabled={isLoading || isDemoMode} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading || isDemoMode}>
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
                            <Button className="flex-1" variant="outline" onClick={handleSaveDiagram} disabled={isSaving || !db}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Save to Collection
                            </Button>
                        </div>
                    </CardContent>
                 )}
                {!isLoading && !diagramUrl && (
                    <p className="text-muted-foreground text-center p-4">
                        {isDemoMode ? "Diagram Generator is disabled in Demo Mode." : 'Enter a topic and click "Generate" to see your diagram.'}
                    </p>
                )}
            </Card>
        </div>
    </div>
  );
}
