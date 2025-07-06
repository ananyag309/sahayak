
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateLessonPlan, type LessonPlanInput, type Plan } from "@/ai/flows/lesson-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download, Lightbulb, BookCheck, PencilRuler } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  topics: z.string().min(5, { message: "Please list some topics." }),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

export default function PlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<Plan | null>(null);
  const [tips, setTips] = useState<string[] | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", grade: "", topics: "", language: "en"},
  });

  const formatPlanForDownload = (plan: Plan): string => {
    let content = `Weekly Lesson Plan\n`;
    content += `Subject: ${plan.subject}\n`;
    content += `Grade: ${plan.grade}\n`;
    content += `Topic: ${plan.topic}\n\n`;
    content += "----------------------------------------\n\n";

    plan.days.forEach(day => {
        content += `🗓️ ${day.day}: ${day.topic}\n\n`;
        content += `  Activities:\n`;
        day.activities.forEach(act => {
            content += `    - ${act.activity}\n`;
            content += `      Materials: ${act.materials}\n\n`;
        });
        content += `  Homework: ${day.homework}\n\n`;
        content += "----------------------------------------\n\n";
    });

    if (tips && tips.length > 0) {
        content += "💡 Improvement Tips:\n";
        tips.forEach(tip => {
            content += `- ${tip}\n`;
        });
    }

    return content;
  };

  const handleCopy = () => {
    if (!lessonPlan) return;
    const planText = formatPlanForDownload(lessonPlan);
    navigator.clipboard.writeText(planText);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const planText = formatPlanForDownload(lessonPlan);
    const blob = new Blob([planText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lesson-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLessonPlan(null);
    setTips(null);
    try {
      const input: LessonPlanInput = values;
      const result = await generateLessonPlan(input);
      
      setLessonPlan(result.plan);
      setTips(result.tips);

      if (user && db && user.uid !== 'demo-user') {
        await addDoc(collection(db, "lessonPlans"), {
          userId: user.uid,
          ...result.plan,
          tips: result.tips,
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

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Enhanced Lesson Planner</h1>
          <p className="text-muted-foreground">Generate a structured weekly lesson plan with improvement tips.</p>
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </Trigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                            <SelectItem value="mr">Marathi</SelectItem>
                            <SelectItem value="ta">Tamil</SelectItem>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Plan & Tips"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Weekly Plan</h2>
          <p className="text-muted-foreground">Your structured lesson plan will appear below.</p>
        </header>
        <div className="space-y-4">
          {isLoading && (
              <Card className="min-h-[500px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary"/>
              </Card>
          )}

          {lessonPlan && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{lessonPlan.subject} - Grade {lessonPlan.grade}</CardTitle>
                            <CardDescription>{lessonPlan.topic}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy plan"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download plan"><Download className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" defaultValue={['Monday']} className="w-full">
                        {lessonPlan.days.map(day => (
                            <AccordionItem key={day.day} value={day.day}>
                                <AccordionTrigger className="font-semibold text-lg">{day.day}: {day.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pl-2">
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><PencilRuler className="h-4 w-4 text-primary" />Activities</h4>
                                        <ul className="list-disc list-inside space-y-2">
                                            {day.activities.map((act, index) => (
                                                <li key={index}>
                                                    {act.activity}
                                                    <p className="text-sm text-muted-foreground ml-4"><span className="font-semibold">Materials:</span> {act.materials}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><BookCheck className="h-4 w-4 text-primary" />Homework</h4>
                                        <p>{day.homework}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
          )}
          
          {tips && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <Lightbulb className="h-6 w-6"/> Improvement Tips
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-3 list-disc list-inside text-yellow-800 dark:text-yellow-300">
                          {tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                          ))}
                      </ul>
                  </CardContent>
              </Card>
          )}

          {!isLoading && !lessonPlan && (
              <Card className="min-h-[500px] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                      Fill out the form to generate your lesson plan.
                  </p>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
