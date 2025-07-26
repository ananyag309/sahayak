
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateDiagram, type GenerateDiagramInput } from "@/ai/flows/diagram-generator";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Download, Loader2, Save, FolderPlus } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
});

type Folder = {
  id: string;
  name: string;
  tags: string[];
};

export default function DiagramPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('new-folder');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  useEffect(() => {
    if (!user || user.uid === 'demo-user' || !db) return;
    const q = query(collection(db, "folders"), where("userId", "==", user.uid), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userFolders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
      setFolders(userFolders);
    });
    return () => unsubscribe();
  }, [user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setDiagramUrl(null);
    setCurrentTopic(values.topic);

    try {
      const input: GenerateDiagramInput = { topic: values.topic };
      const result = await generateDiagram(input);
      const dataUri = result.diagramDataUri;

      if (user && user.uid !== 'demo-user' && storage) {
        const fetchRes = await fetch(dataUri);
        const blob = await fetchRes.blob();
        const storageRef = ref(storage, `diagrams/${user.uid}/${values.topic.replace(/\s+/g, '_')}-${Date.now()}.png`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setDiagramUrl(downloadURL);
      } else {
        setDiagramUrl(dataUri);
      }
      
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

  const openSaveDialog = () => {
    if (!diagramUrl || !user || user.uid === 'demo-user') {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "You must be signed in to save diagrams.",
      });
      return;
    }
    setNewFolderName(currentTopic || '');
    setNewFolderTags('');
    setSelectedFolder('new-folder');
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!user || !diagramUrl || !currentTopic) return;
    setIsSaving(true);
    try {
        let folderId = selectedFolder;
        let tags: string[] = [];

        if (folderId === 'new-folder') {
            if (!newFolderName.trim()) {
                toast({ variant: 'destructive', title: 'Folder name is required' });
                setIsSaving(false);
                return;
            }
            tags = newFolderTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            const newFolderRef = await addDoc(collection(db, "folders"), {
                userId: user.uid,
                name: newFolderName,
                tags,
                createdAt: serverTimestamp(),
            });
            folderId = newFolderRef.id;
        } else {
            const folder = folders.find(f => f.id === folderId);
            if(folder) tags = folder.tags;
        }

        await addDoc(collection(db, "diagrams"), {
            userId: user.uid,
            topic: currentTopic,
            diagramUrl: diagramUrl,
            folderId: folderId,
            tags: tags, // For easier searching
            createdAt: serverTimestamp(),
        });

        toast({ title: "Diagram saved to your library!" });
        setIsSaveDialogOpen(false);
        
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Could not save diagram to your library.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                              <Button className="flex-1" variant="outline" onClick={openSaveDialog} disabled={isSaving || (user?.uid === 'demo-user')}>
                                  <Save className="mr-2 h-4 w-4"/>
                                  Save to Library
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
      
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Save to Library</DialogTitle>
                <DialogDescription>Organize your diagram by saving it to a folder.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="folder-select">Folder</Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger id="folder-select">
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new-folder">
                                <span className="flex items-center gap-2"><FolderPlus className="h-4 w-4"/> Create new folder</span>
                            </SelectItem>
                            {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedFolder === 'new-folder' && (
                    <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                         <div className="space-y-2">
                            <Label htmlFor="new-folder-name">New Folder Name</Label>
                            <Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g., Grade 4 Science" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-folder-tags">Tags (comma-separated)</Label>
                            <Input id="new-folder-tags" value={newFolderTags} onChange={(e) => setNewFolderTags(e.target.value)} placeholder="e.g., science, biology, diagrams" />
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
