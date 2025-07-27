
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateVideo, type GenerateVideoInput } from "@/ai/flows/video-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

export default function VideoPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setVideoUrl(null);
    setCurrentTopic(values.topic);

    try {
      const input: GenerateVideoInput = { topic: values.topic };
      const result = await generateVideo(input);
      setVideoUrl(result.videoDataUri);
      
      toast({ title: "Video generated successfully!" });
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Video Generation Failed",
        description: error.message || "The AI was unable to create a video. This might be due to high demand or a problem with the model. Please try again later.",
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
                  <h1 className="text-3xl font-bold tracking-tight font-headline">Video Generator</h1>
                  <p className="text-muted-foreground">Enter a topic to generate a short, educational video using AI.</p>
              </header>
              <Card>
                  <CardHeader>
                      <CardTitle>Create Video</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Experimental Feature</AlertTitle>
                        <AlertDescription>
                            Video generation is a new technology. It can take over a minute to complete and may occasionally fail due to high demand.
                        </AlertDescription>
                      </Alert>
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
                                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Video"}
                              </Button>
                          </form>
                      </Form>
                  </CardContent>
              </Card>
          </div>
          <div>
              <header className="mb-4">
                  <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Video</h2>
                  <p className="text-muted-foreground">Your video will appear here.</p>
              </header>
              <Card className="min-h-[400px] flex items-center justify-center aspect-video">
                  {isLoading && (
                      <div className="flex flex-col items-center gap-4 text-center p-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                          <p className="text-muted-foreground">Generating your video...<br/>This can take over a minute.</p>
                      </div>
                  )}
                  {!isLoading && videoUrl && (
                      <CardContent className="p-6 w-full h-full flex flex-col justify-center">
                          <div className="w-full rounded-lg overflow-hidden border">
                              <video src={videoUrl} controls autoPlay muted loop className="w-full h-full aspect-video">
                                  Your browser does not support the video tag.
                              </video>
                          </div>
                           <Button className="w-full mt-4" asChild>
                                <a href={videoUrl} download={`video-${currentTopic?.replace(/\s+/g, '-')}.mp4`}>
                                    <Download className="mr-2 h-4 w-4"/> Download Video
                                </a>
                            </Button>
                      </CardContent>
                  )}
                  {!isLoading && !videoUrl && (
                      <p className="text-muted-foreground text-center p-4">
                          Enter a topic and click "Generate" to see your video.
                      </p>
                  )}
              </Card>
          </div>
      </div>
    </>
  );
}
