
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Sparkles, Loader2, Clock, Upload, FileCheck, LogIn } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Ticket } from '@/services/ticket-marketplace';
import { postTicket as postTicketService } from '@/services/ticket-marketplace'; // Import service directly

const formSchemaBase = z.object({
  type: z.enum(['train', 'event', 'movie', 'bus', 'sports'], { required_error: 'Ticket type is required.' }),
  title: z.string().optional(), // Title is optional by default
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive({ message: 'Price must be positive.' })
    .multipleOf(0.01, { message: 'Price can have up to 2 decimal places.'})
    .min(0.01, { message: 'Price must be at least ₹0.01' }),
  date: z.date({ required_error: 'A date is required.' })
         .min(startOfToday(), { message: "Date cannot be in the past." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }),
  location: z.string().optional(),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  originalTicketDataUri: z.string().optional(),
});

const formSchema = formSchemaBase.superRefine((data, ctx) => {
  if ((data.type === 'event' || data.type === 'movie' || data.type === 'sports')) {
    if (!data.title || data.title.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title is required and must be at least 3 characters for Event, Movie, or Sports tickets.',
        path: ['title'],
      });
    }
    if (data.title && data.title.trim().length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title must not exceed 100 characters.',
        path: ['title'],
      });
    }
    if (!data.location || data.location.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Location / Venue is required for Event, Movie, or Sports tickets.',
        path: ['location'],
      });
    }
  }
  if ((data.type === 'train' || data.type === 'bus') && (!data.fromCity || data.fromCity.trim() === '' || !data.toCity || data.toCity.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Departure and Destination cities are required for Train or Bus tickets.',
      path: ['fromCity'], // Or ['toCity'] or make it a general form error
    });
  }
});


type FormData = z.infer<typeof formSchema>;

interface PostTicketFormProps {
  onTypeChange?: (type: FormData['type'] | undefined) => void;
}

export function PostTicketForm({ onTypeChange }: PostTicketFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useNextSearchParams();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = React.useState(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  React.useEffect(() => {
      if (typeof window !== 'undefined') {
          setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      }
      const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'isLoggedIn') {
              setIsLoggedIn(event.newValue === 'true');
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
          window.removeEventListener('storage', handleStorageChange);
      };
  }, []);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: '',
      description: '',
      price: undefined,
      date: undefined,
      time: '',
      location: '',
      fromCity: '',
      toCity: '',
      originalTicketDataUri: undefined,
    },
  });

  const ticketType = form.watch('type');

  React.useEffect(() => {
    if (onTypeChange) {
      onTypeChange(ticketType);
    }
    if (ticketType === 'train' || ticketType === 'bus') {
       form.setValue('location', '');
       form.setValue('title', ''); // Clear title for non-event types
    } else if (ticketType === 'event' || ticketType === 'movie' || ticketType === 'sports') {
       form.setValue('fromCity', '');
       form.setValue('toCity', '');
    }
  }, [ticketType, onTypeChange, form]);


  const handleGrammarCheck = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 10) {
      form.setError('description', { message: 'Description must be at least 10 characters to check grammar.'})
      toast({
        title: 'Cannot Check Grammar',
        description: 'Please enter a description of at least 10 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsCheckingGrammar(true);
    try {
      const result = await checkTicketDescription({ description });
      if (result.correctedDescription && result.correctedDescription !== description) {
        form.setValue('description', result.correctedDescription, { shouldValidate: true });
        toast({
          title: 'Grammar Checked',
          description: 'Description updated with corrections.',
        });
      } else {
         toast({
           title: 'Grammar Check Complete',
           description: 'No significant corrections needed or unable to process.',
           variant: 'default'
         });
      }
    } catch (error) {
      console.error('Error checking grammar:', error);
      toast({
        title: 'Error',
        description: 'Failed to check grammar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: 'File Too Large',
                description: 'Please select a file smaller than 5MB.',
                variant: 'destructive',
            });
             setSelectedFileName(null);
             form.setValue('originalTicketDataUri', undefined);
             if (fileInputRef.current) {
                fileInputRef.current.value = '';
             }
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            form.setValue('originalTicketDataUri', reader.result as string, { shouldValidate: true });
            setSelectedFileName(file.name);
             toast({
               title: 'File Selected',
               description: `Selected: ${file.name}`,
             });
        };
        reader.onerror = () => {
            console.error('Error reading file');
            toast({
                title: 'Error Reading File',
                description: 'Could not read the selected file. Please try again.',
                variant: 'destructive',
            });
             setSelectedFileName(null);
             form.setValue('originalTicketDataUri', undefined);
             if (fileInputRef.current) {
                fileInputRef.current.value = '';
             }
        };
        reader.readAsDataURL(file);
    } else {
        setSelectedFileName(null);
        form.setValue('originalTicketDataUri', undefined);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const redirectToLogin = () => {
    const currentRedirectPath = pathname + '?' + searchParamsHook.toString();
    router.push(`/login?redirect=${encodeURIComponent(currentRedirectPath)}`);
  };


  async function onSubmit(values: FormData) {
    if (!isLoggedIn) {
        setShowLoginDialog(true);
        return;
    }
    setIsSubmitting(true);
    try {
      const ticketPayloadForService: any = {
        type: values.type,
        description: values.description,
        price: values.price,
        date: format(values.date, 'yyyy-MM-dd'),
        time: values.time,
        location: values.location,
        fromCity: values.fromCity,
        toCity: values.toCity,
        originalTicketDataUri: values.originalTicketDataUri,
      };

      // Only include title if it has a value
      if (values.title) {
        ticketPayloadForService.title = values.title;
      }

      const createdTicket = await postTicketService(ticketPayloadForService);

      if (!createdTicket || !createdTicket.id) {
         throw new Error('Failed to post ticket: No ticket data returned from service.');
      }

      toast({
        title: 'Ticket Posted!',
        description: `Your ${createdTicket.title || createdTicket.type} ticket for ${createdTicket.location || `${createdTicket.fromCity} to ${createdTicket.toCity}`} has been successfully listed.`,
        duration: 5000,
      });
      form.reset();
      setSelectedFileName(null);
       if (fileInputRef.current) {
          fileInputRef.current.value = '';
       }
      setTimeout(() => {
          router.push(`/tickets?category=${createdTicket.type}`);
      }, 1500);

    } catch (error: any) {
      console.error('Error posting ticket:', error);
      let description = 'Something went wrong while posting your ticket. Please check the details and try again.';
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        description = 'Storage limit reached. Could not post ticket. Please clear some space or try removing the uploaded file.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
          title: 'Error Posting Ticket',
          description: description,
          variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Form {...form}>
       <form
         onSubmit={form.handleSubmit(onSubmit)}
         className={cn(
           "space-y-6 max-w-2xl p-6 md:p-8 rounded-lg shadow relative z-10 bg-card",
           ticketType === 'movie' ? 'bg-card/90 backdrop-blur-sm' : ''
         )}
        >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
               <FormLabel className="text-foreground">Ticket Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(ticketType === 'movie' || ticketType === 'event' || ticketType === 'sports') && (
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Title (e.g., Event/Movie/Match Name) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Avengers Premiere, Rock Fest, Champions Final"
                    className="text-foreground"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-muted-foreground">
                  Provide a specific title for your event, movie, or sports ticket.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
               <FormLabel className="text-foreground">Description *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Add details like seat number, section, special features, route specifics..."
                    className="min-h-[100px] resize-none text-foreground"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={handleGrammarCheck}
                    disabled={isCheckingGrammar || isSubmitting || !field.value || field.value.length < 10}
                    title="Check Grammar & Spelling (AI)"
                  >
                    {isCheckingGrammar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="sr-only">Check Grammar</span>
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground">
                Provide clear details (min 10 chars). Use <Sparkles className="inline h-3 w-3 align-text-bottom" /> for AI check.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
       <FormField
          control={form.control}
          name="originalTicketDataUri"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Original Ticket (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                         className='gap-2'
                     >
                       {selectedFileName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                       {selectedFileName ? "Change File" : "Upload Original Ticket"}
                     </Button>
                     <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                    />
                     {selectedFileName && (
                       <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                         {selectedFileName}
                       </span>
                     )}
                </div>
              </FormControl>
               <FormDescription className="text-muted-foreground">
                 Upload a picture or scan of the original ticket (max 5MB). This helps build trust with buyers.
               </FormDescription>
              <FormMessage />
            </FormItem>
          )}
       />
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Price (₹) *</FormLabel>
                <FormControl>
                   <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1500.50"
                      className="text-foreground"
                      {...field}
                      value={field.value === undefined || field.value === null || isNaN(field.value) ? '' : String(field.value)}
                      onChange={(e) => {
                         const value = e.target.value;
                         field.onChange(value === '' ? undefined : parseFloat(value));
                      }}
                      min="0.01"
                      />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                 <FormLabel className="text-foreground">Date *</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal justify-start',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < startOfToday() }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                 <FormLabel className="text-foreground">Time (HH:MM) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="time"
                      placeholder="e.g., 14:30"
                      className="text-foreground appearance-none"
                       {...field}
                     />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
       </div>
        {(ticketType === 'train' || ticketType === 'bus') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fromCity"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-foreground">From (City) *</FormLabel>
                  <FormControl>
                     <Input
                       placeholder="e.g., New York"
                       className="text-foreground"
                       {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toCity"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-foreground">To (City) *</FormLabel>
                  <FormControl>
                     <Input
                       placeholder="e.g., Boston"
                       className="text-foreground"
                       {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
         {(ticketType === 'event' || ticketType === 'movie' || ticketType === 'sports') && (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-foreground">Location / Venue *</FormLabel>
                  <FormControl>
                     <Input
                       placeholder="e.g., Madison Square Garden, AMC Lincoln Square, City Stadium"
                        className="text-foreground"
                        {...field} />
                  </FormControl>
                   <FormDescription className="text-muted-foreground">Be specific about the place.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
         )}
         {(ticketType === 'train' || ticketType === 'bus') && (
             <FormField
               control={form.control}
               name="location" // This location is for platform/gate for train/bus
               render={({ field }) => (
                 <FormItem>
                    <FormLabel className="text-foreground">Platform / Gate / Terminal (Optional)</FormLabel>
                   <FormControl>
                      <Input
                        placeholder="e.g., Grand Central Terminal, Platform 5, Gate B3"
                         className="text-foreground"
                         {...field} />
                   </FormControl>
                   <FormDescription className="text-muted-foreground">Add specific departure point details if known.</FormDescription>
                   <FormMessage />
                 </FormItem>
               )}
             />
         )}
         <Button
            type="submit"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting || isCheckingGrammar}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting Ticket...
            </>
          ) : (
            'Post Ticket for Sale'
          )}
        </Button>
         <p className="text-xs text-muted-foreground text-center">Fields marked with * are required.</p>
      </form>
    </Form>
    <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to post a ticket. Please log in or create an account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={redirectToLogin} className="gap-2 bg-[#FF2459] text-white hover:bg-[#FF2459]/90">
              <LogIn className="h-4 w-4" /> Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
