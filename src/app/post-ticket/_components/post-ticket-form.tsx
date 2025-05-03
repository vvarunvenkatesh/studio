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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { checkTicketDescription } from '@/ai/flows/check-ticket-description'; // Import AI flow
import { postTicket } from '@/services/ticket-marketplace'; // Import service function

// Define the validation schema using Zod
const formSchema = z.object({
  type: z.string().min(1, { message: 'Ticket type is required.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must not exceed 500 characters.' }),
  price: z.coerce // Coerce input to number
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive({ message: 'Price must be positive.' }),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
});

type FormData = z.infer<typeof formSchema>;

export function PostTicketForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      description: '',
      price: 0,
      date: undefined, // Initialize date as undefined
      location: '',
    },
  });

  // Handle AI Grammar Check
  const handleGrammarCheck = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 10) {
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
      if (result.correctedDescription) {
        form.setValue('description', result.correctedDescription, { shouldValidate: true });
        toast({
          title: 'Grammar Checked',
          description: 'Description updated with corrections.',
        });
      } else {
         toast({
           title: 'Grammar Check',
           description: 'No corrections needed or unable to process.',
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
      const ticketData = {
        ...values,
        id: Math.random().toString(36).substring(2, 15), // Generate a simple random ID
        date: format(values.date, 'yyyy-MM-dd'),
      };

      const createdTicket = await postTicket(ticketData); // Call API function

      toast({
        title: 'Ticket Posted!',
        description: `Your ${createdTicket.type} ticket (ID: ${createdTicket.id}) has been successfully posted.`,
      });
      form.reset(); // Reset form after successful submission
       // Optionally redirect user or clear form
       // router.push('/'); // Example redirection
    } catch (error) {
      console.error('Error posting ticket:', error);
      toast({
        title: 'Error Posting Ticket',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
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
                    placeholder="Describe the ticket (e.g., seat number, event details, route)"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 h-7 w-7"
                    onClick={handleGrammarCheck}
                    disabled={isCheckingGrammar || isSubmitting}
                    title="Check Grammar & Spelling"
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
                Provide details about the ticket. You can use the sparkle icon to check grammar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    step="0.01" // Allow cents
                    placeholder="Enter the selling price"
                    {...field}
                    // Ensure value passed to input is string or number, handle potential NaN
                    value={field.value === null || isNaN(field.value) ? '' : field.value}
                    onChange={(e) => {
                       const value = e.target.value;
                       // Allow empty string or parse as float
                       field.onChange(value === '' ? null : parseFloat(value));
                    }}
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
              <FormLabel>Date of Event/Travel</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) } // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Departure Point</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grand Central Terminal, Madison Square Garden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting || isCheckingGrammar}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Ticket'
          )}
        </Button>
      </form>
    </Form>
  );
}
