
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import jsPDF from "jspdf";
import { 
    generateHomeworkSheet, 
    generateAnswerKey,
    type GenerateHomeworkSheetOutput,
    type GenerateAnswerKeyOutput 
} from "@/ai/flows/homework-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BookCopy, KeyRound } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  grade: z.string().min(1, { message: "Please select a grade." }),
  language: z.enum(['en', 'hi', 'mr', 'ta', 'bn', 'te', 'kn', 'gu', 'pa', 'es', 'fr', 'de'], { required_error: "Please select a language." }),
});

type Worksheet = GenerateHomeworkSheetOutput;
type AnswerKey = GenerateAnswerKeyOutput['answerKey'];

const languageButtonText: Record<z.infer<typeof formSchema>['language'], string> = {
    en: 'Download PDF',
    hi: 'पीडीएफ़ डाउनलोड करें',
    mr: 'पीडीएफ डाउनलोड करा',
    ta: 'PDF பதிவிறக்கவும்',
    bn: 'পিডিএফ ডাউনলোড করুন',
    te: 'PDF డౌన్లోడ్ చేయండి',
    kn: 'ಪಿಡಿಎಫ್ ಡೌನ್ಲೋಡ್ ಮಾಡಿ',
    gu: 'પીડીએફ ડાઉનલોડ કરો',
    pa: 'ਪੀਡੀਐਫ ਡਾਊਨਲੋਡ ਕਰੋ',
    es: 'Descargar PDF',
    fr: 'Télécharger le PDF',
    de: 'PDF Herunterladen',
};

export default function HomeworkPage() {
  const { toast } = useToast();
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        language: "en",
        topic: "",
        grade: "",
    },
  });

  async function handleGenerateSheet(values: z.infer<typeof formSchema>) {
    setIsLoadingQuestions(true);
    setWorksheet(null);
    setAnswerKey(null);
    try {
      const result = await generateHomeworkSheet(values);
      setWorksheet(result);
      toast({ title: "Worksheet generated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Worksheet Generation Failed",
        description: error.message || "The AI was unable to generate a worksheet. Please try again.",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  const handleGenerateAnswerKey = async () => {
    if (!worksheet) return;
    setIsLoadingAnswers(true);
    setAnswerKey(null);

    try {
        const result = await generateAnswerKey({
            questions: worksheet.questions,
            language: form.getValues('language'),
        });
        setAnswerKey(result.answerKey);
        toast({ title: "Answer key generated successfully!" });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Answer Key Generation Failed",
            description: error.message || "Could not generate the answer key. Please try again.",
        });
    } finally {
        setIsLoadingAnswers(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!worksheet || !answerKey) return;
    setIsDownloading(true);

    try {
        const doc = new jsPDF();
        
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let y = 20;

        const checkPageBreak = (neededHeight: number) => {
            if (y + neededHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // --- Worksheet Page ---
        doc.setFontSize(20);
        doc.text(worksheet.title, pageWidth / 2, y, { align: 'center' });
        y += 12;

        doc.setFontSize(11);
        doc.text(`Name: _________________________`, margin, y);
        doc.text(`Date: ____________________`, pageWidth - margin, y, { align: 'right' });
        y += 10;
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text("Instructions:", margin, y);
        y += 6;

        doc.setFontSize(11);
        const instructionLines = doc.splitTextToSize(worksheet.instructions, pageWidth - margin * 2);
        doc.text(instructionLines, margin, y);
        y += (instructionLines.length * 5) + 8;
        
        worksheet.questions.forEach((q) => {
            const questionText = `${q.questionNumber}. ${q.questionText}`;
            const splitText = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
            const neededHeight = (splitText.length * 5) + 12;
            checkPageBreak(neededHeight);
            
            doc.text(splitText, margin, y);
            y += neededHeight;
        });

        // --- Answer Key Page ---
        doc.addPage();
        y = 20;

        doc.setFontSize(20);
        doc.text("Answer Key", pageWidth / 2, y, { align: 'center' });
        y += 15;

        answerKey.forEach((a) => {
            const questionText = `${a.questionNumber}. (Question from previous page)`;
            const answerText = `Answer: ${a.answerText}`;
            
            const splitQuestion = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
            const splitAnswer = doc.splitTextToSize(answerText, pageWidth - (margin * 2));
            
            const neededHeight = (splitQuestion.length * 5) + (splitAnswer.length * 5) + 8;
            checkPageBreak(neededHeight);
            
            doc.setFontSize(11);
            doc.text(splitQuestion, margin, y);
            y += (splitQuestion.length * 5) + 2;

            doc.setFontSize(11);
            doc.text(splitAnswer, margin + 5, y);
            y += (splitAnswer.length * 5) + 8;
        });
        
        doc.save(`homework-${worksheet.title.replace(/\s/g, '_')}.pdf`);
        toast({ title: "PDF Download Started!" });
    } catch (err: any) {
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: err.message || "Could not generate PDF.",
        });
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Homework Sheet Generator</h1>
          <p className="text-muted-foreground">Generate questions and a separate answer key for any topic.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Homework Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateSheet)} className="space-y-4">
                <FormField control={form.control} name="topic" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl><Input placeholder="e.g., The Mughal Empire" {...field} disabled={isLoadingQuestions || isLoadingAnswers} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="grade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingQuestions || isLoadingAnswers} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger></FormControl>
                      <SelectContent>{[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`}>Grade {i + 1}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingQuestions || isLoadingAnswers}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(languageButtonText).map(([key, value]) => (
                            <SelectItem key={key} value={key as z.infer<typeof formSchema>['language']}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoadingQuestions || isLoadingAnswers || isDownloading}>
                  {isLoadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Worksheet"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Sheet</h2>
          <p className="text-muted-foreground">Your worksheet and answer key will appear below.</p>
        </header>
        <Card className="min-h-[500px]">
          {(isLoadingQuestions) && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">AI is preparing your worksheet...</p>
            </div>
          )}
          {worksheet && !isLoadingQuestions && (
             <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <CardTitle>{worksheet.title}</CardTitle>
                    <Button onClick={handleDownloadPdf} disabled={!answerKey || isDownloading || isLoadingQuestions || isLoadingAnswers}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {languageButtonText[form.getValues('language')]}
                    </Button>
                </div>
                
                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/> Questions</h3>
                    <p className="text-sm text-muted-foreground mb-4">{worksheet.instructions}</p>
                    <ul className="space-y-4 list-decimal list-inside">
                        {worksheet.questions.map((q) => <li key={q.questionNumber}>{q.questionText}</li>)}
                    </ul>
                </div>

                <Separator />

                <div>
                    {!answerKey && !isLoadingAnswers && (
                        <Button variant="secondary" className="w-full" onClick={handleGenerateAnswerKey} disabled={isLoadingQuestions}>
                            <KeyRound className="mr-2 h-4 w-4" /> Generate Answer Key
                        </Button>
                    )}
                    {isLoadingAnswers && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">Generating answer key...</p>
                        </div>
                    )}
                    {answerKey && !isLoadingAnswers && (
                        <>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> Answer Key</h3>
                            <ul className="space-y-4 list-decimal list-inside">
                                {answerKey.map((a) => <li key={a.questionNumber}>{a.answerText}</li>)}
                            </ul>
                        </>
                    )}
                </div>

             </CardContent>
          )}
          {!worksheet && !isLoadingQuestions && (
             <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground text-center">Fill out the form to generate a homework worksheet.</p>
             </div>
          )}
        </Card>
      </div>
    </div>
  );
}

    