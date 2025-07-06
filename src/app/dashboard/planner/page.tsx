"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateLessonPlan, type LessonPlanInput } from "@/ai/flows/lesson-planner";
import { getTeacherFeedback, type TeacherFeedbackOutput } from "@/ai/flows/teacher-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  topics: z.string().min(5, { message: "Please list some topics." }),
});

export default function PlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<TeacherFeedbackOutput | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", grade: "", topics: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLessonPlan(null);
    setFeedback(null);
    try {
      const input: LessonPlanInput = values;
      const result = await generateLessonPlan(input);
      setLessonPlan(result.weeklyPlan);

      if (user && db) {
        await addDoc(collection(db, "lessonPlans"), {
          userId: user.uid,
          subject: values.subject,
          grade: values.grade,
          topics: values.topics,
          weekPlan: result.weeklyPlan,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Lesson plan generated and saved!" });
      } else {
        toast({ title: "Lesson plan generated!" });
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Plan Generation Failed",
        description: error.message || "Failed to generate lesson plan. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (!lessonPlan) return;
    navigator.clipboard.writeText(lessonPlan);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lesson-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleGetFeedback = async () => {
    if (!lessonPlan) return;
    setIsFeedbackLoading(true);
    setFeedback(null);
    try {
        const input = {
            subject: form.getValues('subject'),
            grade: form.getValues('grade'),
            topic: form.getValues('topics'),
            lessonPlan: lessonPlan,
        };
        const result = await getTeacherFeedback(input);
        setFeedback(result);
        toast({ title: "Feedback generated!" });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Feedback Generation Failed",
            description: "Could not generate feedback at this time. Please try again.",
        });
    } finally {
        setIsFeedbackLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lesson Planner</h1>
          <p className="text-muted-foreground">Generate a weekly lesson plan with topics, activities, and materials.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl><Input placeholder="e.g., Science" {...field} disabled={isLoading} /></FormControl>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade level" />
                          </SelectTrigger>
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
                <FormField
                  control={form.control}
                  name="topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics to Cover</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Photosynthesis, Cell Structure, Plant Life Cycle" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || isFeedbackLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Plan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Weekly Plan</h2>
          <p className="text-muted-foreground">Your lesson plan will appear below.</p>
        </header>
        <Card className="min-h-[500px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
                {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                {lessonPlan && (
                    <>
                        <div className="flex justify-end gap-2 mb-2">
                            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy plan"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download plan"><Download className="h-4 w-4" /></Button>
                        </div>
                        <ScrollArea className="flex-1 rounded-md border p-4 bg-muted">
                            <pre className="text-sm whitespace-pre-wrap font-sans">{lessonPlan}</pre>
                        </ScrollArea>
                    </>
                )}
                {!isLoading && !lessonPlan && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground text-center">
                           Fill out the form to generate your lesson plan.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
        {lessonPlan && (
            <div className="mt-4">
                {!feedback && !isFeedbackLoading && (
                    <Button onClick={handleGetFeedback} variant="outline" className="w-full" disabled={isLoading}>
                        <Lightbulb className="mr-2 h-4 w-4" /> Get Improvement Tips
                    </Button>
                )}
                {isFeedbackLoading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        <span>Your personal coach is generating feedback...</span>
                    </div>
                )}
                {feedback && (
                    <Card className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                <Lightbulb className="h-6 w-6"/> Engagement Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4 list-disc list-inside text-yellow-800 dark:text-yellow-300">
                                {feedback.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
