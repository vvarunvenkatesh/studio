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
import { CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { format, startOfToday } from 'date-fns'; // Import startOfToday
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description';
import { postTicket } from '@/services/ticket-marketplace';
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

// Define the validation schema using Zod
const formSchema = z.object({
  type: z.string().min(1, { message: 'Ticket type is required.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  price: z.coerce // Coerce input to number
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive({ message: 'Price must be positive.' })
    .multipleOf(0.01, { message: 'Price can have up to 2 decimal places.'}) // Optional: Ensure cents
    .min(0.01, { message: 'Price must be at least $0.01' }),
  date: z.date({ required_error: 'A date is required.' })
         .min(startOfToday(), { message: "Date cannot be in the past." }), // Ensure date is not in the past
  location: z.string().min(2, { message: 'Location is required.' }),
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
      type: '',
      description: '',
      price: undefined, // Initialize price as undefined for better placeholder behavior
      date: undefined,
      location: '',
    },
  });

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
           variant: 'default' // Use default variant for informational message
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
      // Format date to YYYY-MM-DD string before sending
      // The service function expects specific fields, exclude id and status
      const ticketData = {
        type: values.type,
        description: values.description,
        price: values.price,
        date: format(values.date, 'yyyy-MM-dd'),
        location: values.location,
      };

      const createdTicket = await postTicket(ticketData);

      toast({
        title: 'Ticket Posted!',
        description: `Your ${createdTicket.type} ticket for "${createdTicket.location}" has been successfully listed.`,
        duration: 5000, // Keep toast longer
      });
      form.reset(); // Reset form after successful submission

      // Redirect to the home page after a short delay to allow user to see the toast
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
              <FormLabel>Ticket Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  {/* Consider adding 'other' or more specific types */}
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Describe the ticket (e.g., seat number 'Sec 101, Row 5, Seat 12', event details 'Opening Act: The Starters', route 'NYC Penn Station to Washington Union Station')"
                    className="min-h-[100px] resize-none" // Allow resizing, set min height
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={handleGrammarCheck}
                    disabled={isCheckingGrammar || isSubmitting}
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
                Provide clear details. Use the sparkle icon <Sparkles className="inline h-3 w-3 align-text-bottom" /> for AI grammar check.
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
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                   <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 25.50"
                      {...field}
                      // Handle value representation and change parsing
                      value={field.value === undefined || field.value === null || isNaN(field.value) ? '' : String(field.value)}
                      onChange={(e) => {
                         const value = e.target.value;
                         // Allow empty string (sets to undefined), otherwise parse as float
                         field.onChange(value === '' ? undefined : parseFloat(value));
                      }}
                      min="0.01" // HTML5 validation
                      />
                </FormControl>
                 <FormDescription>Enter the selling price.</FormDescription>
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
                <FormLabel>Date of Event/Travel</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal justify-start', // Align left
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {field.value ? (
                          format(field.value, 'PPP') // e.g., Sep 20, 2024
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
                      disabled={(date) => date < startOfToday() } // Disable past dates strictly
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 <FormDescription>Select the relevant date.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
       </div>


        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Venue / Departure Point</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grand Central Terminal, Madison Square Garden, AMC Lincoln Square" {...field} />
              </FormControl>
               <FormDescription>Be specific about the place.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting || isCheckingGrammar}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting Ticket...
            </>
          ) : (
            'Post Ticket for Sale'
          )}
        </Button>
      </form>
    </Form>
  );
}
