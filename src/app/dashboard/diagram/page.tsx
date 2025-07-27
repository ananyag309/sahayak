
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateDiagram, type GenerateDiagramInput } from "@/ai/flows/diagram-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

export default function DiagramPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
      setDiagramUrl(result.diagramDataUri);
      toast({ title: "Diagram generated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Diagram Generation Failed",
        description: error.message || "The AI was unable to create a diagram for this topic. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
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
                                      <Input placeholder="e.g., The Water Cycle" {...field} disabled={isLoading} />
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
                  {isLoading && (
                      <div className="flex flex-col items-center gap-4 text-center p-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                          <p className="text-muted-foreground">Generating your diagram...<br/>This can take up to 30 seconds.</p>
                      </div>
                  )}
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
                          </div>
                      </CardContent>
                  )}
                  {!isLoading && !diagramUrl && (
                      <p className="text-muted-foreground text-center p-4">
                          Enter a topic and click "Generate" to see your diagram.
                      </p>
                  )}
              </Card>
          </div>
      </div>
    </>
  );
}
