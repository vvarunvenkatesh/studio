
'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h5 className="font-semibold text-foreground mb-3">
                <span className="text-destructive">L</span>ast<span className="text-destructive">M</span>inI<span className="text-primary">T</span>
            </h5>
            <p className="text-sm">
              Your platform for reselling train, bus, event, and movie tickets at the last minute.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">Quick Links</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-primary hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link></li>
              <li><Link href="/about" className="hover:text-primary hover:underline">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary hover:underline">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">Follow Us</h5>
            <div className="flex space-x-4">
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-primary">
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
            <p className="text-sm mt-4">
              For support: <a href="mailto:support@lastminit.com" className="text-primary hover:underline">support@lastminit.com</a>
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-muted-foreground/20 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} LastMinIT. All rights reserved.</p>
          <p>This is a demonstration platform. Please read our Terms & Conditions.</p>
        </div>
      </div>
    </footer>
  );
}
