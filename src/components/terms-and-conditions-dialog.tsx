'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"; // Ensure Button is imported

interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function TermsAndConditionsDialog({ open, onOpenChange, onAccept }: TermsAndConditionsDialogProps) {
  // More comprehensive placeholder terms
  const placeholderTerms = `
Last Updated: ${new Date().toLocaleDateString()}

Welcome to LastMiniT!

These terms and conditions outline the rules and regulations for the use of LastMiniT's Website, located at [Your Website URL Here].

By accessing this website we assume you accept these terms and conditions. Do not continue to use LastMiniT if you do not agree to take all of the terms and conditions stated on this page.

Cookies:
The website uses cookies to help personalize your online experience. By accessing LastMiniT, you agreed to use the required cookies.

License:
Unless otherwise stated, LastMiniT and/or its licensors own the intellectual property rights for all material on LastMiniT. All intellectual property rights are reserved. You may access this from LastMiniT for your own personal use subjected to restrictions set in these terms and conditions.

You must not:
- Republish material from LastMiniT
- Sell, rent or sub-license material from LastMiniT
- Reproduce, duplicate or copy material from LastMiniT
- Redistribute content from LastMiniT

This Agreement shall begin on the date hereof.

User Responsibilities:
- Ticket Validity: Sellers are solely responsible for ensuring that any ticket they list for sale is valid, authentic, and that they have the legal right to resell it. Misrepresentation of tickets is strictly prohibited.
- Accurate Information: Sellers must provide accurate and complete details about the ticket, including event name, date, time, venue, seat information (if applicable), and any restrictions or conditions.
- Ticket Transfer: Sellers are responsible for the timely and accurate transfer of the ticket to the buyer upon successful purchase as per platform guidelines (if applicable for digital transfers outside the platform).
- Pricing: Sellers determine their own prices. LastMiniT acts as a platform and does not set ticket prices.
- Compliance with Laws: Users must comply with all local, state, and federal laws regarding ticket resale.

Buyer Acknowledgements:
- Nature of Resale: Buyers acknowledge they are purchasing tickets from other users (sellers), not directly from LastMiniT or the original event organizer/venue.
- Risk: While LastMiniT encourages transparency and provides features like original ticket uploads, it does not guarantee the validity of every ticket. Buyers purchase at their own risk. It is recommended to review seller information and ticket details carefully.
- No Guarantee of Entry: LastMiniT is not responsible if a buyer is denied entry to an event due to issues with a resold ticket, unless such an issue is a direct result of a platform malfunction.

Platform Role and Limitation of Liability:
- Marketplace: LastMiniT is a platform provider and is not a party to the transaction between buyer and seller.
- No Endorsement: Listing of a ticket does not imply endorsement or verification by LastMiniT.
- Disputes: LastMiniT may, at its discretion, offer assistance in resolving disputes but is not obligated to do so and will not act as an arbitrator.
- As Is: The platform is provided "as is" and "as available" without any warranties, express or implied.
- No Liability: LastMiniT shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform or for the cost of procurement of substitute goods and services or resulting from any goods or services purchased or obtained or messages received or transactions entered into through the platform.

Prohibited Activities:
- Listing or selling fraudulent, counterfeit, stolen, or otherwise illegal tickets.
- Using the platform for any unlawful purpose.
- Interfering with the platform's operations or other users' enjoyment of the platform.
- Creating multiple accounts to circumvent platform rules or restrictions.

Reporting and Enforcement:
- Users can report suspicious listings or problematic transactions.
- LastMiniT reserves the right to suspend or terminate accounts, remove listings, and take other appropriate actions for violations of these terms.

Service Fees (Simulated):
- LastMiniT may charge a service fee on transactions. Currently, all payment processes, including fees, are simulated for demonstration purposes.

Intellectual Property:
- All content on LastMiniT, including text, graphics, logos, and software, is the property of LastMiniT or its content suppliers and protected by intellectual property laws.

Governing Law:
- These terms will be governed by and interpreted in accordance with the laws of [Your Jurisdiction], and you submit to the non-exclusive jurisdiction of the state and federal courts located in [Your Jurisdiction] for the resolution of any disputes.

By clicking "Accept", you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
  `;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl w-[90vw] md:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">Terms and Conditions</AlertDialogTitle>
          <AlertDialogDescription>
            Please read and accept our terms and conditions to continue using LastMiniT.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="h-[50vh] max-h-[400px] md:max-h-[500px] w-full rounded-md border p-4 whitespace-pre-wrap text-sm bg-muted/20">
          {placeholderTerms}
        </ScrollArea>
        <AlertDialogFooter>
          <Button onClick={onAccept} className="bg-primary text-primary-foreground hover:bg-primary/90">Accept &amp; Continue</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
