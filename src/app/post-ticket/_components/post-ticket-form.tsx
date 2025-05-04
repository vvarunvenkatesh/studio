
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
import { CalendarIcon, Sparkles, Loader2, Clock, Upload, FileCheck } from 'lucide-react'; // Added Upload, FileCheck
import { format, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description';
import { postTicket } from '@/services/ticket-marketplace';
import { useRouter } from 'next/navigation';

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
   path: ['fromCity'],
});


type FormData = z.infer<typeof formSchema>;

interface PostTicketFormProps {
  onTypeChange?: (type: FormData['type'] | undefined) => void;
}

export function PostTicketForm({ onTypeChange }: PostTicketFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = React.useState(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null); // State for selected file name
  const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref for file input

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
    // // Reset file input if needed based on type changes (optional)
    // if (ticketType !== 'train') { // Example: Reset only if NOT a train ticket
    //    form.setValue('originalTicketDataUri', undefined);
    //    setSelectedFileName(null);
    //    if (fileInputRef.current) {
    //       fileInputRef.current.value = '';
    //    }
    // }
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


  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
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

      setTimeout(() => {
         router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Error posting ticket:', error);
      toast({
        title: 'Error Posting Ticket',
        description: 'Something went wrong while posting your ticket. Please check the details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
       {/* Reverted dynamic background color change based on ticketType */}
       <form
         onSubmit={form.handleSubmit(onSubmit)}
         className={cn(
           "space-y-6 max-w-2xl p-6 md:p-8 rounded-lg shadow relative z-10 bg-card", // Use default bg-card
         )}
        >

        {/* Ticket Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              {/* Reverted text color change */}
               <FormLabel>Ticket Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                   {/* Reverted background/border/text color changes */}
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
              {/* Reverted text color change */}
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
               {/* Reverted text color change */}
               <FormLabel>Description *</FormLabel>
              <FormControl>
                <div className="relative">
                   {/* Reverted background/border/text color changes */}
                  <Textarea
                    placeholder="Add details like seat number, section, special features, route specifics..."
                    className="min-h-[100px] resize-none text-foreground"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    // Reverted text color change
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
              {/* Reverted text color change */}
              <FormDescription>
                Provide clear details (min 10 chars). Use <Sparkles className="inline h-3 w-3 align-text-bottom" /> for AI check.
              </FormDescription>
              {/* Reverted text color change */}
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
              {/* Reverted text color change */}
              <FormLabel>Original Ticket (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                        // Reverted background/border/text color changes
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
                        // Reverted text color change
                       <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                         {selectedFileName}
                       </span>
                     )}
                </div>
              </FormControl>
              {/* Reverted text color change */}
               <FormDescription>
                 Upload a picture or scan of the original ticket (max 5MB). This helps build trust with buyers.
               </FormDescription>
              {/* Reverted text color change */}
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
                 {/* Reverted text color change */}
                <FormLabel>Price (₹) *</FormLabel>
                <FormControl>
                   {/* Reverted background/border/text color changes */}
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
                {/* Reverted text color change */}
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
                 {/* Reverted text color change */}
                 <FormLabel>Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                       {/* Reverted background/border/text color changes */}
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
                      onSelect={field.onChange}
                      disabled={(date) => date < startOfToday() }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* Reverted text color change */}
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
                 {/* Reverted text color change */}
                 <FormLabel>Time (HH:MM) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    {/* Reverted background/border/text color changes */}
                    <Input
                      type="time"
                      placeholder="e.g., 14:30"
                      className="text-foreground"
                       {...field}
                     />
                    {/* Reverted text color change */}
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                {/* Reverted text color change */}
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
                   {/* Reverted text color change */}
                   <FormLabel>From (City) *</FormLabel>
                  <FormControl>
                     {/* Reverted background/border/text color changes */}
                     <Input
                       placeholder="e.g., New York"
                       className="text-foreground"
                       {...field} />
                  </FormControl>
                  {/* Reverted text color change */}
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
                   {/* Reverted text color change */}
                   <FormLabel>To (City) *</FormLabel>
                  <FormControl>
                     {/* Reverted background/border/text color changes */}
                     <Input
                       placeholder="e.g., Boston"
                       className="text-foreground"
                       {...field} />
                  </FormControl>
                  {/* Reverted text color change */}
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
                   {/* Reverted text color change */}
                   <FormLabel>Location / Venue *</FormLabel>
                  <FormControl>
                     {/* Reverted background/border/text color changes */}
                     <Input
                       placeholder="e.g., Madison Square Garden, AMC Lincoln Square, City Stadium"
                        className="text-foreground"
                        {...field} />
                  </FormControl>
                   {/* Reverted text color change */}
                   <FormDescription>Be specific about the place.</FormDescription>
                  {/* Reverted text color change */}
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
                    {/* Reverted text color change */}
                    <FormLabel>Platform / Gate / Terminal (Optional)</FormLabel>
                   <FormControl>
                      {/* Reverted background/border/text color changes */}
                      <Input
                        placeholder="e.g., Grand Central Terminal, Platform 5, Gate B3"
                         className="text-foreground"
                         {...field} />
                   </FormControl>
                   {/* Reverted text color change */}
                   <FormDescription>Add specific departure point details if known.</FormDescription>
                   {/* Reverted text color change */}
                   <FormMessage />
                 </FormItem>
               )}
             />
         ) : null}


        {/* Submit Button */}
         {/* Reverted background/text color changes */}
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
         {/* Reverted text color change */}
         <p className="text-xs text-muted-foreground text-center">Fields marked with * are required.</p>
      </form>
    </Form>
  );
}
