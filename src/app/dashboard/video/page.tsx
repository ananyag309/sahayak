
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateVisualStory, type GenerateVisualStoryInput, type GenerateVisualStoryOutput } from "@/ai/flows/video-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

export default function VisualStoryPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [story, setStory] = useState<GenerateVisualStoryOutput | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });
  
  useState(() => {
    if (!carouselApi) return
    setCurrent(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap())
    })
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setStory(null);

    try {
      const input: GenerateVisualStoryInput = { topic: values.topic };
      const result = await generateVisualStory(input);
      setStory(result);
      toast({ title: "Visual story generated successfully!" });
    } catch (error: any) {
      console.error("Visual Story Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Story Generation Failed",
        description: error.message || "The AI was unable to create a story. Please try again.",
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
                  <h1 className="text-3xl font-bold tracking-tight font-headline">Visual Story Generator</h1>
                  <p className="text-muted-foreground">Turn any topic into a simple, illustrated story for your students.</p>
              </header>
              <Card>
                  <CardHeader>
                      <CardTitle>Create Story</CardTitle>
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
                                      <Input placeholder="e.g., How Bees Make Honey" {...field} disabled={isLoading} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <Button type="submit" className="w-full" disabled={isLoading}>
                                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4" />Generate Story</>}
                              </Button>
                          </form>
                      </Form>
                  </CardContent>
              </Card>
          </div>
          <div>
              <header className="mb-4">
                  <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Story</h2>
                  <p className="text-muted-foreground">Your story will appear here as an interactive slideshow.</p>
              </header>
              <Card className="min-h-[400px] flex items-center justify-center">
                  {isLoading && (
                      <div className="flex flex-col items-center gap-4 text-center p-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                          <p className="text-muted-foreground">Generating your story...<br/>This can take up to a minute.</p>
                      </div>
                  )}
                  {!isLoading && story && (
                      <CardContent className="p-6 w-full h-full flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-center mb-4">{story.title}</h3>
                          <Carousel setApi={setCarouselApi} className="w-full">
                            <CarouselContent>
                              {story.scenes.map((scene, index) => (
                                <CarouselItem key={index}>
                                  <div className="flex flex-col gap-4 items-center">
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                      <Image src={scene.imageUrl} alt={scene.imagePrompt} layout="fill" objectFit="cover" />
                                    </div>
                                    <p className="text-center text-muted-foreground h-20">{scene.narration}</p>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            Slide {current + 1} of {story.scenes.length}
                         </div>
                      </CardContent>
                  )}
                  {!isLoading && !story && (
                      <p className="text-muted-foreground text-center p-4">
                          Enter a topic and click "Generate" to create a visual story.
                      </p>
                  )}
              </Card>
          </div>
      </div>
    </>
  );
}
