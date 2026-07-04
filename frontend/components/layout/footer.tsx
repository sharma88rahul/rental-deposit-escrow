import * as React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/10 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight text-foreground">RentSure</span>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} RentSure. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href={siteConfig.links.github} target="_blank" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
