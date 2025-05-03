
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
import { CalendarIcon, Sparkles, Loader2, Clock } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description';
import { postTicket } from '@/services/ticket-marketplace';
import { useRouter } from 'next/navigation';

// Define the validation schema using Zod
const formSchema = z.object({
  type: z.enum(['train', 'event', 'movie', 'bus', 'sports'], { required_error: 'Ticket type is required.' }), // Added 'sports'
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive({ message: 'Price must be positive.' })
    .multipleOf(0.01, { message: 'Price can have up to 2 decimal places.'})
    .min(0.01, { message: 'Price must be at least $0.01' }),
  date: z.date({ required_error: 'A date is required.' })
         .min(startOfToday(), { message: "Date cannot be in the past." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }), // HH:MM format
  location: z.string().optional(), // Optional for train/bus
  fromCity: z.string().optional(), // Optional for event/movie/sports
  toCity: z.string().optional(), // Optional for event/movie/sports
}).refine(data => {
  // Conditional validation: location is required for event/movie/sports
  if ((data.type === 'event' || data.type === 'movie' || data.type === 'sports') && !data.location) { // Added 'sports'
    return false;
  }
  return true;
}, {
  message: 'Location / Venue is required for Event, Movie, or Sports tickets.', // Updated message
  path: ['location'], // Specify the path of the error
}).refine(data => {
   // Conditional validation: fromCity and toCity are required for train/bus
  if ((data.type === 'train' || data.type === 'bus') && (!data.fromCity || !data.toCity)) {
    return false;
  }
  return true;
}, {
   message: 'Departure and Destination cities are required for Train or Bus tickets.',
   path: ['fromCity'], // Can point to either, or create separate refinements
});


type FormData = z.infer<typeof formSchema>;

export function PostTicketForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined, // Start with no type selected
      description: '',
      price: undefined,
      date: undefined,
      time: '',
      location: '',
      fromCity: '',
      toCity: '',
    },
  });

  const ticketType = form.watch('type'); // Watch the ticket type field

  // Handle AI Grammar Check
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


  // Handle Form Submission
  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const ticketData = {
        type: values.type,
        description: values.description,
        price: values.price,
        date: format(values.date, 'yyyy-MM-dd'),
        time: values.time,
        location: values.location || '', // Ensure location is string even if undefined initially
        fromCity: values.fromCity, // Keep optional fields as they are
        toCity: values.toCity,
      };

      const createdTicket = await postTicket(ticketData);

      toast({
        title: 'Ticket Posted!',
        description: `Your ${createdTicket.type} ticket for ${createdTicket.location || `${createdTicket.fromCity} to ${createdTicket.toCity}`} has been successfully listed.`,
        duration: 5000,
      });
      form.reset();

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-card p-6 md:p-8 rounded-lg shadow">

        {/* Ticket Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket Type *</FormLabel>
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
                  <SelectItem value="sports">Sports</SelectItem> {/* Added Sports */}
                </SelectContent>
              </Select>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Add details like seat number, section, special features, route specifics..."
                    className="min-h-[100px] resize-none"
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
              <FormDescription>
                Provide clear details (min 10 chars). Use <Sparkles className="inline h-3 w-3 align-text-bottom" /> for AI check.
              </FormDescription>
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
                <FormLabel>Price ($) *</FormLabel>
                <FormControl>
                   <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 25.50"
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

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date *</FormLabel>
                <Popover>
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
                      onSelect={field.onChange}
                      disabled={(date) => date < startOfToday() }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <FormLabel>Time (HH:MM) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="time" placeholder="e.g., 14:30" {...field} />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
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
                  <FormLabel>From (City) *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New York" {...field} />
                  </FormControl>
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
                  <FormLabel>To (City) *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Boston" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

         {ticketType === 'event' || ticketType === 'movie' || ticketType === 'sports' ? ( // Added 'sports'
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Venue *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Madison Square Garden, AMC Lincoln Square, City Stadium" {...field} /> {/* Updated placeholder */}
                  </FormControl>
                   <FormDescription>Be specific about the place.</FormDescription>
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
                   <FormLabel>Platform / Gate / Terminal (Optional)</FormLabel>
                   <FormControl>
                     <Input placeholder="e.g., Grand Central Terminal, Platform 5, Gate B3" {...field} />
                   </FormControl>
                   <FormDescription>Add specific departure point details if known.</FormDescription>
                   <FormMessage />
                 </FormItem>
               )}
             />
         ) : null}


        {/* Submit Button */}
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting || isCheckingGrammar}>
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
  );
}
