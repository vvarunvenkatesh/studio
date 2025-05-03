'use server';
/**
 * @fileOverview Flow for checking the grammar and spelling of a ticket description.
 *
 * - checkTicketDescription - A function that checks the grammar and spelling of a ticket description.
 * - CheckTicketDescriptionInput - The input type for the checkTicketDescription function.
 * - CheckTicketDescriptionOutput - The return type for the checkTicketDescription function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CheckTicketDescriptionInputSchema = z.object({
  description: z.string().describe('The ticket description to check.'),
});

export type CheckTicketDescriptionInput = z.infer<
  typeof CheckTicketDescriptionInputSchema
>;

const CheckTicketDescriptionOutputSchema = z.object({
  correctedDescription: z
    .string()
    .describe('The ticket description with improved grammar and spelling.'),
});

export type CheckTicketDescriptionOutput = z.infer<
  typeof CheckTicketDescriptionOutputSchema
>;

export async function checkTicketDescription(
  input: CheckTicketDescriptionInput
): Promise<CheckTicketDescriptionOutput> {
  return checkTicketDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkTicketDescriptionPrompt',
  input: {
    schema: z.object({
      description: z
        .string()
        .describe('The ticket description that needs to be checked.'),
    }),
  },
  output: {
    schema: z.object({
      correctedDescription: z
        .string()
        .describe('The ticket description with improved grammar and spelling.'),
    }),
  },
  prompt: `Please check the following ticket description for spelling and grammar errors and provide a corrected version:\n\n{{{description}}}`,
});

const checkTicketDescriptionFlow = ai.defineFlow<
  typeof CheckTicketDescriptionInputSchema,
  typeof CheckTicketDescriptionOutputSchema
>(
  {
    name: 'checkTicketDescriptionFlow',
    inputSchema: CheckTicketDescriptionInputSchema,
    outputSchema: CheckTicketDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
