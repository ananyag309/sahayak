
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react";
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
  curriculum: z.string({ required_error: "Please select a curriculum." }),
});

// Helper to shuffle array for the matching game
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

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const languageConfig = {
    en: { name: 'English', fontName: 'Helvetica', buttonText: 'Download Worksheet', fontUrl: null },
    hi: { name: 'Hindi', fontName: 'NotoSansDevanagari', buttonText: 'हिंदी वर्कशीट डाउनलोड करें', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-all-400-normal.ttf' },
    mr: { name: 'Marathi', fontName: 'NotoSansDevanagari', buttonText: 'मराठी वर्कशीट डाउनलोड करा', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-all-400-normal.ttf' },
    ta: { name: 'Tamil', fontName: 'NotoSansTamil', buttonText: 'தமிழ் பணித்தாள் பதிவிறக்கம்', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tamil/files/noto-sans-tamil-all-400-normal.ttf' },
    bn: { name: 'Bengali', fontName: 'NotoSansBengali', buttonText: 'পিডিএফ ডাউনলোড করুন', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-bengali/files/noto-sans-bengali-all-400-normal.ttf' },
    te: { name: 'Telugu', fontName: 'NotoSansTelugu', buttonText: 'PDF డౌన్లోడ్ చేయండి', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-telugu/files/noto-sans-telugu-all-400-normal.ttf' },
    kn: { name: 'Kannada', fontName: 'NotoSansKannada', buttonText: 'ಪಿಡಿಎಫ್ ಡೌನ್ಲೋಡ್ ಮಾಡಿ', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kannada/files/noto-sans-kannada-all-400-normal.ttf' },
    gu: { name: 'Gujarati', fontName: 'NotoSansGujarati', buttonText: 'પીડીએફ ડાઉનલોડ કરો', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-gujarati/files/noto-sans-gujarati-all-400-normal.ttf' },
    pa: { name: 'Punjabi', fontName: 'NotoSansGurmukhi', buttonText: 'ਪੀਡੀਐਫ ਡਾਊਨਲੋਡ ਕਰੋ', fontUrl: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-gurmukhi/files/noto-sans-gurmukhi-all-400-normal.ttf' },
    es: { name: 'Spanish', fontName: 'Helvetica', buttonText: 'Descargar PDF', fontUrl: null },
    fr: { name: 'French', fontName: 'Helvetica', buttonText: 'Télécharger le PDF', fontUrl: null },
    de: { name: 'German', fontName: 'Helvetica', buttonText: 'PDF Herunterladen', fontUrl: null },
} as const;


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
        // We can't know the language key for the config, so we'll default to English for the button text
        // and Helvetica for the font if a custom one isn't needed. This part is imperfect.
        const langKey = 'en';
        const config = languageConfig[langKey];
        const isCustomFont = false; // Cannot determine this without knowing language

        if (isCustomFont) {
            // This block will likely not run, but is kept for structure.
        }
        
        doc.setFont(config.fontName);
        
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let y = 20;

        const setStyle = (style: 'normal' | 'bold') => {
          if (!isCustomFont) doc.setFont(config.fontName, style);
          else doc.setFont(config.fontName, 'normal');
        }

        const checkPageBreak = (neededHeight: number) => {
            if (y + neededHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
                return true; // Page break occurred
            }
            return false;
        };
        
        doc.setFontSize(20);
        setStyle('bold');
        doc.text("Sahayak AI Worksheet", pageWidth / 2, y, { align: 'center' });
        y += 12;

        doc.setFontSize(11);
        setStyle('normal');
        doc.text(`Name: _________________________`, margin, y);
        doc.text(`Date: ____________________`, pageWidth - margin, y, { align: 'right' });
        y += 7;
        doc.text(`Grade: ${results.identifiedGradeLevel || '______'}`, margin, y);
        y += 7;

        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        // Add curriculum info
        doc.setFontSize(12);
        setStyle('bold');
        doc.text("Sub-Topic:", margin, y);
        doc.setFontSize(11);
        setStyle('normal');
        doc.text(results.subTopic, margin + 25, y);
        y += 7;

        doc.setFontSize(12);
        setStyle('bold');
        doc.text("Learning Objectives:", margin, y);
        doc.setFontSize(11);
        setStyle('normal');
        const objectivesLines = doc.splitTextToSize(results.learningObjectives, pageWidth - (margin * 2) - 38);
        doc.text(objectivesLines, margin + 38, y);
        y += (objectivesLines.length * 5) + 5;

        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        let questionCounter = 1;
        const addSection = (title: string, questions: string[]) => {
          if (!questions || questions.length === 0) return;

          checkPageBreak(12);
          doc.setFontSize(14);
          setStyle('bold');
          doc.text(title, margin, y);
          y += 8;
          doc.setFontSize(11);
          setStyle('normal');

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
        questionCounter = 1; // Reset for next section
        addSection("B. Fill in the Blanks", results.fillInTheBlankQuestions);
        questionCounter = 1; // Reset for next section
        addSection("C. Short Answer Questions", results.shortAnswerQuestions);

        if (results.matchTheColumnQuestions && results.matchTheColumnQuestions.length > 0) {
            checkPageBreak(20);
            doc.setFontSize(14);
            setStyle('bold');
            doc.text("D. Match the Columns", margin, y);
            y += 8;
            doc.setFontSize(11);
            setStyle('normal');
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
                setStyle('bold');
                doc.text("Column A", colAstartX, y);
                doc.text("Column B", colBstartX, y);
                y += rowLineHeight + rowPadding;
                doc.setFontSize(11);
                setStyle('normal');
            };

            drawHeader();

            for (let i = 0; i < terms.length; i++) {
                const termText = `${i + 1}. ${terms[i]}`;
                const defText = `${String.fromCharCode(97 + i)}. ${shuffledDefinitions[i]}`;
                
                const termLines = doc.splitTextToSize(termText, colWidth);
                const defLines = doc.splitTextToSize(defText, colWidth);
                const lineCount = Math.max(termLines.length, defLines.length);
                const neededHeight = lineCount * rowLineHeight + rowPadding;

                if(checkPageBreak(neededHeight + 12)) { // +12 for header
                    drawHeader();
                }

                doc.text(termLines, colAstartX, y);
                doc.text(defLines, colBstartX, y);
                y += neededHeight;
            }
        }
        
        doc.save(`sahayak-worksheet-grade-${results.identifiedGradeLevel.replace(/\s/g, '_')}.pdf`);
        toast({ title: "PDF Download Started!" });
    } catch(err: any) {
        console.error("PDF Generation Error:", err);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: err.message || "Could not generate PDF. The required font may be unavailable."
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
            language: "auto-detected",
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
          <p className="text-muted-foreground">Upload a photo of a textbook page to generate a curriculum-aligned, downloadable PDF worksheet.</p>
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

    

    