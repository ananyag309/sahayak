
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, Search, FileImage, Layers3, BookText, AlertTriangle, Library as LibraryIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Asset = {
    id: string;
    topic: string; // for diagrams, lesson plans, etc.
    diagramUrl?: string; // only for diagrams
    // Add other asset fields here as needed
    folderId: string | null;
    tags: string[];
    createdAt: any;
    type: 'diagram' | 'lessonPlan' | 'worksheet'; // Example types
};

type Folder = {
    id: string;
    name: string;
    tags: string[];
};

export default function LibraryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<'all' | 'uncategorized' | string>('all');

    useEffect(() => {
        if (!user || user.uid === 'demo-user') {
            setIsLoading(false);
            return;
        }

        // --- Fetch Folders (with onSnapshot for real-time updates) ---
        // Query without ordering by name to avoid needing a composite index
        const folderQuery = query(collection(db, "folders"), where("userId", "==", user.uid));
        const unsubscribeFolders = onSnapshot(folderQuery, (snapshot) => {
            const userFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
            // Sort folders on the client-side
            userFolders.sort((a, b) => a.name.localeCompare(b.name));
            setFolders(userFolders);
            setIsLoading(false); // Set loading to false after first fetch
        }, (error) => {
            console.error("Error fetching folders:", error);
            toast({
                variant: "destructive",
                title: "Failed to load folders",
                description: "Could not retrieve your saved folders. Please try again later."
            });
            setIsLoading(false);
        });

        // --- Fetch Assets ---
        const fetchAssets = async () => {
             try {
                // Fetch diagrams (and other assets in the future)
                const diagramQuery = query(collection(db, "diagrams"), where("userId", "==", user.uid));
                const diagramSnapshot = await getDocs(diagramQuery);
                let userDiagrams = diagramSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        topic: data.topic,
                        diagramUrl: data.diagramUrl,
                        folderId: data.folderId || null,
                        tags: data.tags || [],
                        createdAt: data.createdAt,
                        type: 'diagram',
                    } as Asset;
                });
                
                // Sort assets by creation date on the client-side
                userDiagrams.sort((a, b) => {
                    const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });

                setAssets(userDiagrams);
            } catch (error) {
                 console.error("Error fetching library assets:", error);
                toast({
                    variant: "destructive",
                    title: "Failed to load library items",
                    description: "Could not retrieve your saved items. Please try again later."
                })
            }
        };

        fetchAssets();
        
        // Cleanup snapshot listener on unmount
        return () => unsubscribeFolders();

    }, [user, toast]);

    const filteredAssets = useMemo(() => {
        return assets
            .filter(asset => {
                if (selectedFolderId === 'all') return true;
                if (selectedFolderId === 'uncategorized') return !asset.folderId;
                return asset.folderId === selectedFolderId;
            })
            .filter(asset => {
                if (!searchTerm.trim()) return true;
                const lowerSearchTerm = searchTerm.toLowerCase();
                const inTitle = asset.topic.toLowerCase().includes(lowerSearchTerm);
                const inTags = asset.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
                return inTitle || inTags;
            });
    }, [assets, searchTerm, selectedFolderId]);

    const renderAssetCard = (asset: Asset) => {
        const folder = folders.find(f => f.id === asset.folderId);
        return (
            <Card key={asset.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        {asset.type === 'diagram' && <FileImage className="h-6 w-6 text-muted-foreground"/>}
                        {asset.type === 'lessonPlan' && <BookText className="h-6 w-6 text-muted-foreground"/>}
                        {asset.type === 'worksheet' && <Layers3 className="h-6 w-6 text-muted-foreground"/>}
                        <CardTitle className="text-lg leading-tight flex-1">{asset.topic}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    {asset.type === 'diagram' && asset.diagramUrl ? (
                         <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                            <Image src={asset.diagramUrl} alt={asset.topic} layout="fill" objectFit="contain" />
                        </div>
                    ) : (
                        <div className="text-muted-foreground">No preview available</div>
                    )}
                </CardContent>
                <div className="p-4 pt-2 border-t mt-4">
                    {folder && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Folder className="h-3 w-3" />
                            <span>{folder.name}</span>
                        </div>
                    )}
                     <div className="flex flex-wrap gap-1">
                        {asset.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </div>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64" />)}
                </div>
            </div>
        )
    }

    if (user?.uid === 'demo-user') {
        return (
             <div className="col-span-full text-center py-16 rounded-lg border-2 border-dashed">
                <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Library is Disabled in Guest Mode</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sign up for a free account to save and organize your creations.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/signup">Sign Up Now</Link>
                </Button>
            </div>
        )
    }


    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">My Library</h1>
                <p className="text-muted-foreground">Find and manage all your saved content.</p>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by title or tag..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Folders</h3>
                <div className="flex flex-wrap gap-2">
                    <Button variant={selectedFolderId === 'all' ? 'default' : 'outline'} onClick={() => setSelectedFolderId('all')}>All Items</Button>
                    <Button variant={selectedFolderId === 'uncategorized' ? 'default' : 'outline'} onClick={() => setSelectedFolderId('uncategorized')}>Uncategorized</Button>
                    {folders.map(folder => (
                        <Button key={folder.id} variant={selectedFolderId === folder.id ? 'default' : 'outline'} onClick={() => setSelectedFolderId(folder.id)}>{folder.name}</Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAssets.map(renderAssetCard)}
            </div>

            {!isLoading && filteredAssets.length === 0 && (
                <div className="col-span-full text-center py-16 rounded-lg border-2 border-dashed">
                    <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No assets found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {searchTerm ? 'Try a different search term.' : 'Your saved diagrams and other content will appear here.'}
                    </p>
                </div>
            )}
        </div>
    );
}
