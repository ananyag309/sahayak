"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { assessReading, type AssessReadingInput, type AssessReadingOutput } from "@/ai/flows/reading-assessor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Loader2, Play, AlertTriangle, ChevronsRight, Target, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  passage: z.string().min(10, { message: "Passage must be at least 10 characters." }),
});

export default function ReadingPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [assessment, setAssessment] = useState<AssessReadingOutput | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { passage: "The quick brown fox jumps over the lazy dog. This is a simple test to see how well you can read. Please read clearly and at a normal pace." },
  });

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  }, []);

  const startRecording = async () => {
    if (hasPermission) {
      setAudioBlob(null);
      setAudioUrl(null);
      setAssessment(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop all tracks to turn off the microphone indicator
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      toast({ variant: "destructive", title: "Microphone permission denied." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    }
  };

  const toDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!audioBlob) {
        toast({ variant: "destructive", title: "No audio recorded", description: "Please record yourself reading the passage." });
        return;
    }
    setIsLoading(true);
    setAssessment(null);
    try {
      const audioDataUri = await toDataUri(audioBlob);
      const passageWordCount = values.passage.trim().split(/\s+/).length;
      
      const input: AssessReadingInput = {
        passage: values.passage,
        audioDataUri,
        passageWordCount,
        durationSeconds: duration,
      };
      
      const result = await assessReading(input);
      setAssessment(result);
      toast({ title: "Assessment complete!" });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Assessment Failed",
        description: error.message || "The AI was unable to assess this reading. Please try recording again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (hasPermission === false) {
    return (
        <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
                This tool needs access to your microphone to work. Please enable microphone permissions in your browser settings for this site and refresh the page.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reading Assessment</h1>
          <p className="text-muted-foreground">Record yourself reading the passage to get AI-powered feedback.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Read and Record</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="passage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Passage</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter or paste the reading passage here." {...field} rows={8} disabled={isRecording || isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button type="button" onClick={startRecording} disabled={isLoading}>
                      <Mic className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button type="button" variant="destructive" onClick={stopRecording}>
                      <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                    </Button>
                  )}
                  {isRecording && <div className="text-sm text-muted-foreground animate-pulse">Recording... {duration}s</div>}
                </div>

                {audioUrl && !isRecording && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your Recording:</p>
                    <audio src={audioUrl} controls className="w-full" />
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading || isRecording || !audioBlob}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Play className="mr-2 h-4 w-4"/> Assess Reading</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Step 2: View Assessment</h2>
          <p className="text-muted-foreground">Your reading analysis will appear here.</p>
        </header>
        <Card className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">AI is analyzing your reading...</p>
            </div>
          )}
          {assessment && !isLoading && (
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <CardTitle className="flex items-center justify-center gap-2"><Clock className="h-5 w-5"/>WPM</CardTitle>
                    <p className="text-3xl font-bold text-primary">{assessment.wordsPerMinute}</p>
                  </div>
                   <div className="p-4 bg-muted rounded-lg">
                    <CardTitle className="flex items-center justify-center gap-2"><Target className="h-5 w-5"/>Accuracy</CardTitle>
                    <div className="relative h-20">
                      <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary">{assessment.accuracy}%</p>
                      <Progress value={assessment.accuracy} className="absolute inset-x-0 bottom-0 h-2"/>
                    </div>
                  </div>
                   <div className="p-4 bg-muted rounded-lg">
                    <CardTitle className="flex items-center justify-center gap-2"><ChevronsRight className="h-5 w-5"/>Errors</CardTitle>
                    <p className="text-3xl font-bold text-primary">{assessment.mispronouncedWords.length}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">{assessment.feedback}</p>
                </div>
                 {assessment.mispronouncedWords.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Words to Practice</h3>
                        <ul className="space-y-2">
                        {assessment.mispronouncedWords.map((item, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="font-mono text-destructive">{item.word}</span>
                                <span className="text-sm text-muted-foreground">Sounded like: <span className="font-mono">{item.pronunciation}</span></span>
                            </li>
                        ))}
                        </ul>
                    </div>
                 )}
             </CardContent>
          )}
          {!assessment && !isLoading && (
             <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground text-center">Complete Step 1 to see your results.</p>
             </div>
          )}
        </Card>
      </div>
    </div>
  );
}
