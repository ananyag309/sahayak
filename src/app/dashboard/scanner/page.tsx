
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { textbookScanner, type TextbookScannerInput, type TextbookScannerOutput } from "@/ai/flows/textbook-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/components/auth-provider";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';


const formSchema = z.object({
  photo: z.any().refine(file => file?.length == 1, "Please upload a photo."),
  gradeLevel: z.string().min(1, { message: "Please select a grade level." }),
});

// Helper to shuffle array for the matching game
const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


export default function ScannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<TextbookScannerOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const handleDownloadPdf = () => {
    if (!results) {
        toast({ variant: "destructive", title: "No results to download." });
        return;
    }
    
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
    
    // Header
    doc.setFontSize(20).setFont('helvetica', 'bold');
    doc.text("Sahayak AI Worksheet", pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(11).setFont('helvetica', 'normal');
    doc.text(`Name: _________________________`, margin, y);
    doc.text(`Date: ____________________`, pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.text(`Grade: ${form.getValues('gradeLevel') || '______'}`, margin, y);
    y += 7;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Sections
    let questionCounter = 1;
    const addSection = (title: string, questions: string[]) => {
      if (!questions || questions.length === 0) return;

      checkPageBreak(12);
      doc.setFontSize(14).setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 8;
      doc.setFontSize(11).setFont('helvetica', 'normal');

      questions.forEach((q) => {
        const questionText = `${questionCounter}. ${q}`;
        const splitText = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
        const neededHeight = (splitText.length * 5) + 5;
        checkPageBreak(neededHeight);
        doc.text(splitText, margin, y);
        y += neededHeight;
        questionCounter++;
      });
      y+= 5;
    };
    
    addSection("A. Multiple Choice Questions", results.mcqQuestions);
    questionCounter = 1;
    addSection("B. Fill in the Blanks", results.fillInTheBlankQuestions);
    questionCounter = 1;
    addSection("C. Short Answer Questions", results.shortAnswerQuestions);

    // Match the Columns Section
    if (results.matchTheColumnQuestions && results.matchTheColumnQuestions.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(14).setFont('helvetica', 'bold');
        doc.text("D. Match the Columns", margin, y);
        y += 8;
        doc.setFontSize(11).setFont('helvetica', 'normal');
        doc.text("Match the term in Column A with its definition in Column B.", margin, y);
        y += 8;

        const shuffledDefs = shuffleArray(results.matchTheColumnQuestions);
        const colAstartX = margin;
        const colBstartX = pageWidth / 2 + 5;
        const tableStartY = y;

        // Draw Column A
        doc.setFont('helvetica', 'bold');
        doc.text("Column A", colAstartX, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        let colA_Y = y;
        results.matchTheColumnQuestions.forEach((pair, index) => {
            const text = `${index + 1}. ${pair.term}`;
            const split = doc.splitTextToSize(text, (pageWidth / 2) - margin - 5);
            const height = split.length * 5 + 4;
            checkPageBreak(height);
            if (y !== colA_Y) { // New page
                colA_Y = y;
                tableStartY = y - 6;
            }
            doc.text(split, colAstartX, colA_Y);
            colA_Y += height;
        });

        // Draw Column B
        doc.setFont('helvetica', 'bold');
        doc.text("Column B", colBstartX, tableStartY);
        y = tableStartY + 6;
        doc.setFont('helvetica', 'normal');
        let colB_Y = y;
         shuffledDefs.forEach((pair, index) => {
            const text = `${String.fromCharCode(97 + index)}. ${pair.definition}`;
            const split = doc.splitTextToSize(text, (pageWidth / 2) - margin - 5);
            const height = split.length * 5 + 4;
            checkPageBreak(height);
            if (y !== colB_Y) { // New page
                 colB_Y = y;
            }
            doc.text(split, colBstartX, colB_Y);
            colB_Y += height;
        });

        y = Math.max(colA_Y, colB_Y);
    }
    
    doc.save(`sahayak-worksheet-grade-${form.getValues('gradeLevel')}.pdf`);
    toast({ title: "PDF Download Started!" });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults(null);
    try {
      const file = values.photo[0];
      const photoDataUri = await toDataUri(file);
      const input: TextbookScannerInput = { 
        photoDataUri, 
        gradeLevel: values.gradeLevel 
      };
      const result = await textbookScanner(input);
      setResults(result);

      // Save to Firestore only for real users
      if (user && user.uid !== 'demo-user' && storage && db) {
        const storageRef = ref(storage, `textbookUploads/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        await addDoc(collection(db, "worksheets"), {
            userId: user.uid,
            imageURL: imageUrl,
            resultText: JSON.stringify(result),
            grade: values.gradeLevel,
            createdAt: serverTimestamp(),
        });
        toast({ title: "Questions generated and saved!" });
      } else {
        toast({ title: "Questions generated!" });
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Question Generation Failed",
        description: error.message || "The AI was unable to generate questions from this image. Please try a clearer image or a different page.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4 no-print">
        <header>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Textbook Scanner</h1>
          <p className="text-muted-foreground">Upload a photo of a textbook page to generate a downloadable PDF worksheet.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Upload Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Textbook Photo</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="dropzone-file" className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/80", "cursor-pointer")}>
                            {preview ? (
                                <Image src={preview} alt="Preview" width={200} height={200} className="object-contain h-full p-2" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                                </div>
                            )}
                            <Input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp"
                                disabled={isLoading}
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleFileChange(e);
                                }}
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLevel"
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Questions"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {/* On-screen interactive view */}
        <div className="screen-only flex flex-col gap-4 flex-1">
            <header>
                <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Questions</h2>
                <p className="text-muted-foreground">Results from the AI will appear here.</p>
            </header>
            <div className="flex-1">
            {isLoading ? (
                <Card className="min-h-[400px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </Card>
            ) : results ? (
                <>
                <div className="flex justify-end mb-4">
                    <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/> Download PDF</Button>
                </div>
                <Card>
                <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full" defaultValue="mcq">
                        {results.mcqQuestions?.length > 0 && (
                            <AccordionItem value="mcq">
                                <AccordionTrigger className="px-6">Multiple Choice Questions ({results.mcqQuestions.length})</AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <ul className="space-y-2 list-decimal list-inside">
                                        {results.mcqQuestions.map((q, i) => <li key={`mcq-screen-${i}`}>{q}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                         {results.shortAnswerQuestions?.length > 0 && (
                            <AccordionItem value="short-answer">
                                <AccordionTrigger className="px-6">Short Answer ({results.shortAnswerQuestions.length})</AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <ul className="space-y-2 list-decimal list-inside">
                                        {results.shortAnswerQuestions.map((q, i) => <li key={`sa-screen-${i}`}>{q}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {results.fillInTheBlankQuestions?.length > 0 && (
                            <AccordionItem value="fill-in-the-blank">
                                <AccordionTrigger className="px-6">Fill in the Blank ({results.fillInTheBlankQuestions.length})</AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <ul className="space-y-2 list-decimal list-inside">
                                        {results.fillInTheBlankQuestions.map((q, i) => <li key={`fib-screen-${i}`}>{q}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {results.matchTheColumnQuestions?.length > 0 && (
                            <AccordionItem value="match-the-column">
                                <AccordionTrigger className="px-6">Match the Column ({results.matchTheColumnQuestions.length})</AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <table className="w-full text-left">
                                        <thead>
                                        <tr>
                                            <th className="p-2 border-b font-semibold">Term</th>
                                            <th className="p-2 border-b font-semibold">Definition</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {results.matchTheColumnQuestions.map((pair, i) => (
                                            <tr key={`match-pair-${i}`}>
                                                <td className="p-2 border-b align-top">{pair.term}</td>
                                                <td className="p-2 border-b align-top">{pair.definition}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                </CardContent>
                </Card>
                </>
            ) : (
                <Card className="min-h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center p-4">
                        Upload an image to generate questions.
                    </p>
                </Card>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
