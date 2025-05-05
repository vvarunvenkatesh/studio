
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
import { CalendarIcon, Sparkles, Loader2, Clock, Upload, FileCheck, LogIn } from 'lucide-react'; // Added LogIn icon
import { format, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description';
import { postTicket } from '@/services/ticket-marketplace';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Import AlertDialog components

// Define the validation schema using Zod
const formSchema = z.object({
  type: z.enum(['train', 'event', 'movie', 'bus', 'sports'], { required_error: 'Ticket type is required.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive({ message: 'Price must be positive.' })
    .multipleOf(0.01, { message: 'Price can have up to 2 decimal places.'})
    .min(0.01, { message: 'Price must be at least ₹0.01' }), // Updated currency symbol
  date: z.date({ required_error: 'A date is required.' })
         .min(startOfToday(), { message: "Date cannot be in the past." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }), // HH:MM format
  location: z.string().optional(), // Optional for train/bus
  fromCity: z.string().optional(), // Optional for event/movie/sports
  toCity: z.string().optional(), // Optional for event/movie/sports
  originalTicketDataUri: z.string().optional(), // Optional field for the ticket file data URI
}).refine(data => {
  // Conditional validation: location is required for event/movie/sports
  if ((data.type === 'event' || data.type === 'movie' || data.type === 'sports') && !data.location) {
    return false;
  }
  return true;
}, {
  message: 'Location / Venue is required for Event, Movie, or Sports tickets.',
  path: ['location'],
}).refine(data => {
   // Conditional validation: fromCity and toCity are required for train/bus
  if ((data.type === 'train' || data.type === 'bus') && (!data.fromCity || !data.toCity)) {
    return false;
  }
  return true;
}, {
   message: 'Departure and Destination cities are required for Train or Bus tickets.',
   path: ['fromCity'], // Associate error with fromCity field for now
});


type FormData = z.infer<typeof formSchema>;

interface PostTicketFormProps {
  onTypeChange?: (type: FormData['type'] | undefined) => void;
}

export function PostTicketForm({ onTypeChange }: PostTicketFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const searchParams = useNextSearchParams(); // Get current search params
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = React.useState(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null); // State for selected file name
  const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref for file input
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false); // State for calendar popover

  React.useEffect(() => {
      // Check login status on mount
      if (typeof window !== 'undefined') {
          setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      }

      // Listener for login status changes
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
      description: '',
      price: undefined,
      date: undefined,
      time: '',
      location: '',
      fromCity: '',
      toCity: '',
      originalTicketDataUri: undefined, // Default value for the new field
    },
  });

  const ticketType = form.watch('type');

  React.useEffect(() => {
    if (onTypeChange) {
      onTypeChange(ticketType);
    }
    // Reset fields that might not apply to the new type (optional)
    if (ticketType === 'train' || ticketType === 'bus') {
       form.setValue('location', ''); // Reset location if switching to train/bus
    } else if (ticketType === 'event' || ticketType === 'movie' || ticketType === 'sports') {
       form.setValue('fromCity', ''); // Reset cities if switching to event/movie/sports
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

   // Handle file selection and conversion to data URI
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // Example size limit: 5MB
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
        reader.readAsDataURL(file); // Convert file to data URI
    } else {
        setSelectedFileName(null);
        form.setValue('originalTicketDataUri', undefined);
    }
  };

  // Trigger hidden file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Redirect to login page, passing the current path and query string
  const redirectToLogin = () => {
    const currentPath = pathname + '?' + searchParams.toString();
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };


  async function onSubmit(values: FormData) {
    // Check if user is logged in before proceeding
    if (!isLoggedIn) {
        setShowLoginDialog(true);
        return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time into a single ISO string or structure if your backend expects it
      // For this example, we'll keep them separate as defined in the Ticket interface
      const ticketData = {
        type: values.type,
        description: values.description,
        price: values.price,
        date: format(values.date, 'yyyy-MM-dd'),
        time: values.time,
        location: values.location || '',
        fromCity: values.fromCity || '',
        toCity: values.toCity || '',
        originalTicketDataUri: values.originalTicketDataUri, // Include the data URI
      };

      const createdTicket = await postTicket(ticketData);

      toast({
        title: 'Ticket Posted!',
        description: `Your ${createdTicket.type} ticket for ${createdTicket.location || `${createdTicket.fromCity} to ${createdTicket.toCity}`} has been successfully listed.`,
        duration: 5000,
      });
      form.reset();
      setSelectedFileName(null); // Reset file name display
       if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input visually
       }

      // Redirect after a short delay to allow toast visibility
      setTimeout(() => {
         // Redirect to the browse page for the category of the posted ticket
          router.push(`/tickets?category=${createdTicket.type}`);
      }, 1500);

    } catch (error) {
      console.error('Error posting ticket:', error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
          toast({
              title: 'Storage Limit Reached',
              description: 'Could not post ticket because browser storage is full. Please clear some space or try removing the uploaded file.',
              variant: 'destructive',
          });
      } else {
          toast({
              title: 'Error Posting Ticket',
              description: 'Something went wrong while posting your ticket. Please check the details and try again.',
              variant: 'destructive',
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Form {...form}>
       {/* Use default bg-card */}
       <form
         onSubmit={form.handleSubmit(onSubmit)}
         className={cn(
           "space-y-6 max-w-2xl p-6 md:p-8 rounded-lg shadow relative z-10 bg-card", // Use default bg-card
           ticketType === 'movie' ? 'bg-card/90 backdrop-blur-sm' : '' // Conditional style for movie type
         )}
        >

        {/* Ticket Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              {/* Use default text-foreground */}
               <FormLabel className="text-foreground">Ticket Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                   {/* Use default styling */}
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
              {/* Use default text-destructive */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
               {/* Use default text-foreground */}
               <FormLabel className="text-foreground">Description *</FormLabel>
              <FormControl>
                <div className="relative">
                   {/* Use default styling */}
                  <Textarea
                    placeholder="Add details like seat number, section, special features, route specifics..."
                    className="min-h-[100px] resize-none text-foreground" // Ensure text-foreground for input text
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    // Use default text colors
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
              {/* Use default text-muted-foreground */}
              <FormDescription className="text-muted-foreground">
                Provide clear details (min 10 chars). Use <Sparkles className="inline h-3 w-3 align-text-bottom" /> for AI check.
              </FormDescription>
              {/* Use default text-destructive */}
              <FormMessage />
            </FormItem>
          )}
        />

       {/* Optional File Upload for Original Ticket */}
       <FormField
          control={form.control}
          name="originalTicketDataUri"
          render={({ field }) => (
            <FormItem>
              {/* Use default text-foreground */}
              <FormLabel className="text-foreground">Original Ticket (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                        // Use default styling
                         className='gap-2'
                     >
                       {selectedFileName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                       {selectedFileName ? "Change File" : "Upload Original Ticket"}
                     </Button>
                     <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx" // Allow common formats
                        onChange={handleFileChange}
                    />
                     {selectedFileName && (
                        // Use default text-muted-foreground
                       <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                         {selectedFileName}
                       </span>
                     )}
                </div>
              </FormControl>
              {/* Use default text-muted-foreground */}
               <FormDescription className="text-muted-foreground">
                 Upload a picture or scan of the original ticket (max 5MB). This helps build trust with buyers.
               </FormDescription>
              {/* Use default text-destructive */}
              <FormMessage />
            </FormItem>
          )}
       />


       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                 {/* Use default text-foreground */}
                <FormLabel className="text-foreground">Price (₹) *</FormLabel>
                <FormControl>
                   {/* Use default styling */}
                   <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1500.50"
                      className="text-foreground" // Ensure text-foreground for input text
                      {...field}
                      // Handle potential undefined/NaN values for input type number
                      value={field.value === undefined || field.value === null || isNaN(field.value) ? '' : String(field.value)}
                      onChange={(e) => {
                         const value = e.target.value;
                         // Allow clearing the field, otherwise parse as float
                         field.onChange(value === '' ? undefined : parseFloat(value));
                      }}
                      min="0.01" // Ensure min is respected by browser validation
                      />
                </FormControl>
                {/* Use default text-destructive */}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                 {/* Use default text-foreground */}
                 <FormLabel className="text-foreground">Date *</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                       {/* Use default styling */}
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal justify-start', // Added justify-start
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
                          setIsCalendarOpen(false); // Close popover on date selection
                      }}
                      disabled={(date) => date < startOfToday() } // Disable past dates
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* Use default text-destructive */}
                <FormMessage />
              </FormItem>
            )}
          />

           {/* Time */}
           <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                 {/* Use default text-foreground */}
                 <FormLabel className="text-foreground">Time (HH:MM) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    {/* Use default styling */}
                    <Input
                      type="time"
                      placeholder="e.g., 14:30"
                      className="text-foreground appearance-none" // Ensure text-foreground, remove browser default spinner for time
                       {...field}
                     />
                    {/* Use default text-muted-foreground */}
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </FormControl>
                {/* Use default text-destructive */}
                <FormMessage />
              </FormItem>
            )}
          />
       </div>

        {/* Conditional Fields based on Type */}
        {ticketType === 'train' || ticketType === 'bus' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From City */}
            <FormField
              control={form.control}
              name="fromCity"
              render={({ field }) => (
                <FormItem>
                   {/* Use default text-foreground */}
                   <FormLabel className="text-foreground">From (City) *</FormLabel>
                  <FormControl>
                     {/* Use default styling */}
                     <Input
                       placeholder="e.g., New York"
                       className="text-foreground" // Ensure text-foreground
                       {...field} />
                  </FormControl>
                  {/* Use default text-destructive */}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* To City */}
            <FormField
              control={form.control}
              name="toCity"
              render={({ field }) => (
                <FormItem>
                   {/* Use default text-foreground */}
                   <FormLabel className="text-foreground">To (City) *</FormLabel>
                  <FormControl>
                     {/* Use default styling */}
                     <Input
                       placeholder="e.g., Boston"
                       className="text-foreground" // Ensure text-foreground
                       {...field} />
                  </FormControl>
                  {/* Use default text-destructive */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

         {ticketType === 'event' || ticketType === 'movie' || ticketType === 'sports' ? (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                   {/* Use default text-foreground */}
                   <FormLabel className="text-foreground">Location / Venue *</FormLabel>
                  <FormControl>
                     {/* Use default styling */}
                     <Input
                       placeholder="e.g., Madison Square Garden, AMC Lincoln Square, City Stadium"
                        className="text-foreground" // Ensure text-foreground
                        {...field} />
                  </FormControl>
                   {/* Use default text-muted-foreground */}
                   <FormDescription className="text-muted-foreground">Be specific about the place.</FormDescription>
                  {/* Use default text-destructive */}
                  <FormMessage />
                </FormItem>
              )}
            />
         ) : null }

         {/* Optional Location for Train/Bus */}
         {ticketType === 'train' || ticketType === 'bus' ? (
             <FormField
               control={form.control}
               name="location"
               render={({ field }) => (
                 <FormItem>
                    {/* Use default text-foreground */}
                    <FormLabel className="text-foreground">Platform / Gate / Terminal (Optional)</FormLabel>
                   <FormControl>
                      {/* Use default styling */}
                      <Input
                        placeholder="e.g., Grand Central Terminal, Platform 5, Gate B3"
                         className="text-foreground" // Ensure text-foreground
                         {...field} />
                   </FormControl>
                   {/* Use default text-muted-foreground */}
                   <FormDescription className="text-muted-foreground">Add specific departure point details if known.</FormDescription>
                   {/* Use default text-destructive */}
                   <FormMessage />
                 </FormItem>
               )}
             />
         ) : null}


        {/* Submit Button */}
         {/* Use default styling */}
         <Button
            type="submit"
            className="w-full gap-2"
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
         {/* Use default text-muted-foreground */}
         <p className="text-xs text-muted-foreground text-center">Fields marked with * are required.</p>
      </form>
    </Form>

    {/* Login Required Dialog */}
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
            <AlertDialogAction onClick={redirectToLogin} className="gap-2">
              <LogIn className="h-4 w-4" /> Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
