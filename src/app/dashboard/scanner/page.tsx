
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { textbookScanner, type TextbookScannerOutput, type TextbookScannerInput } from "@/ai/flows/textbook-scanner";
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
  curriculum: z.string({ required_error: "Please select a curriculum." }),
});

const shuffleArray = <T,>(array: T[]): T[] => {
    if (!Array.isArray(array)) {
        return [];
    }
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<TextbookScannerOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      curriculum: "NCERT",
    }
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

  const handleDownloadPdf = async () => {
    if (!results) {
        toast({ variant: "destructive", title: "No results to download." });
        return;
    }
    setIsDownloading(true);

    try {
        const doc = new jsPDF();
        
        // Use a standard font that has some unicode support. This avoids the font fetching error for many common cases.
        doc.setFont('Helvetica', 'normal');

        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let y = 20;

        const checkPageBreak = (neededHeight: number) => {
            if (y + neededHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
                return true;
            }
            return false;
        };
        
        doc.setFontSize(20);
        doc.text("Sahayak AI Worksheet", pageWidth / 2, y, { align: 'center' });
        y += 12;

        doc.setFontSize(11);
        doc.text(`Name: _________________________`, margin, y);
        doc.text(`Date: ____________________`, pageWidth - margin, y, { align: 'right' });
        y += 7;
        doc.text(`Grade: ${results.identifiedGradeLevel || '______'}`, margin, y);
        doc.text(`Language: ${results.identifiedLanguage || '______'}`, pageWidth - margin, y, { align: 'right' });
        y += 7;

        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text("Sub-Topic:", margin, y);
        doc.setFontSize(11);
        doc.text(results.subTopic, margin + 25, y);
        y += 7;

        doc.setFontSize(12);
        doc.text("Learning Objectives:", margin, y);
        doc.setFontSize(11);
        const objectivesLines = doc.splitTextToSize(results.learningObjectives, pageWidth - (margin * 2) - 38);
        doc.text(objectivesLines, margin + 38, y);
        y += (objectivesLines.length * 5) + 5;

        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        let questionCounter = 1;
        const addSection = (title: string, questions: string[] | undefined) => {
          if (!questions || questions.length === 0) return;

          checkPageBreak(12);
          doc.setFontSize(14);
          doc.text(title, margin, y);
          y += 8;
          doc.setFontSize(11);

          questions.forEach((q) => {
            const questionText = `${questionCounter}. ${q}`;
            const splitText = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
            const neededHeight = (splitText.length * 5) + 8;
            checkPageBreak(neededHeight);
            doc.text(splitText, margin, y);
            y += neededHeight;
            questionCounter++;
          });
          y+= 5;
        };
        
        addSection("A. Multiple Choice Questions", results.mcqQuestions);
        addSection("B. Fill in the Blanks", results.fillInTheBlankQuestions);
        addSection("C. Short Answer Questions", results.shortAnswerQuestions);

        if (results.matchTheColumnQuestions && results.matchTheColumnQuestions.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(14);
            doc.text("D. Match the Columns", margin, y);
            y += 8;
            doc.setFontSize(11);
            doc.text("Match the term in Column A with its definition in Column B.", margin, y);
            y += 8;

            const terms = results.matchTheColumnQuestions.map(p => p.term);
            const definitions = results.matchTheColumnQuestions.map(p => p.definition);
            const shuffledDefinitions = shuffleArray(definitions);

            const colAstartX = margin;
            const colBstartX = pageWidth / 2 + 5;
            const colWidth = (pageWidth / 2) - margin - 10;
            const rowLineHeight = 5;
            const rowPadding = 4;
            
            const drawHeader = () => {
                doc.setFontSize(12);
                doc.text("Column A", colAstartX, y);
                doc.text("Column B", colBstartX, y);
                y += rowLineHeight + rowPadding;
                doc.setFontSize(11);
            };

            drawHeader();

            for (let i = 0; i < terms.length; i++) {
                const termText = `${i + 1}. ${terms[i]}`;
                const defText = `${String.fromCharCode(97 + i)}. ${shuffledDefinitions[i]}`;
                
                const termLines = doc.splitTextToSize(termText, colWidth);
                const defLines = doc.splitTextToSize(defText, colWidth);
                const lineCount = Math.max(termLines.length, defLines.length);
                const neededHeight = lineCount * rowLineHeight + rowPadding;

                if(checkPageBreak(neededHeight + 12)) {
                    drawHeader();
                }

                doc.text(termLines, colAstartX, y);
                doc.text(defLines, colBstartX, y);
                y += neededHeight;
            }
        }
        
        doc.save(`sahayak-worksheet-${results.identifiedGradeLevel.replace(/\s/g, '_')}.pdf`);
        toast({ title: "PDF Download Started!" });
    } catch(err: any) {
        console.error("PDF Generation Error:", err);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: err.message || "Could not generate PDF. The text may contain characters not supported by standard PDF fonts.",
        });
    } finally {
        setIsDownloading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults(null);
    try {
      const file = values.photo[0];
      const photoDataUri = await toDataUri(file);
      const input: TextbookScannerInput = { 
        photoDataUri, 
        curriculum: values.curriculum,
      };
      const result = await textbookScanner(input);
      setResults(result);

      if (user && user.uid !== 'demo-user' && storage && db) {
        const storageRef = ref(storage, `textbookUploads/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        await addDoc(collection(db, "worksheets"), {
            userId: user.uid,
            imageURL: imageUrl,
            resultText: JSON.stringify(result),
            grade: result.identifiedGradeLevel,
            language: result.identifiedLanguage,
            curriculum: values.curriculum,
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
          <p className="text-muted-foreground">Upload a photo of a textbook page. The AI will auto-detect the language and generate a worksheet.</p>
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
                  name="curriculum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curriculum Board</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NCERT">NCERT</SelectItem>
                          <SelectItem value="State Board">State Board (Generic)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || isDownloading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Questions"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="screen-only flex flex-col gap-4 flex-1">
            <header>
                <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Worksheet</h2>
                <p className="text-muted-foreground">Results from the AI will appear here.</p>
            </header>
            <div className="flex-1">
            {isLoading ? (
                <Card className="min-h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="text-muted-foreground">Scanning and generating questions...<br/>This can take up to a minute.</p>
                    </div>
                </Card>
            ) : results ? (
                <>
                <div className="flex justify-end mb-4">
                    <Button onClick={handleDownloadPdf} disabled={isLoading || isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} 
                        Download Worksheet
                    </Button>
                </div>

                <Card className="mb-4">
                  <CardHeader>
                      <CardTitle>Curriculum Alignment</CardTitle>
                      <CardDescription>Based on the {form.getValues('curriculum')} curriculum for the auto-detected grade.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                      <div>
                          <h4 className="font-semibold">Identified Language:</h4>
                          <p className="text-muted-foreground">{results.identifiedLanguage}</p>
                      </div>
                       <div>
                          <h4 className="font-semibold">Identified Grade Level:</h4>
                          <p className="text-muted-foreground">{results.identifiedGradeLevel}</p>
                      </div>
                      <div>
                          <h4 className="font-semibold">Sub-Topic:</h4>
                          <p className="text-muted-foreground">{results.subTopic}</p>
                      </div>
                      <div>
                          <h4 className="font-semibold">Learning Objectives:</h4>
                          <p className="text-muted-foreground whitespace-pre-wrap">{results.learningObjectives}</p>
                      </div>
                  </CardContent>
                </Card>

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
