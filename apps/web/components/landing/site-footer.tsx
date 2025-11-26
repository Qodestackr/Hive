"use client";

import { Mail } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
	return (
		<footer className="relative bg-background border-t border-border">
			<div className="container px-4 mx-auto py-12">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Brand */}
					<div className="text-center md:text-left">
						<Link href="/" className="inline-block mb-2">
							<span className="text-xl font-bold text-foreground">Promco</span>
						</Link>
						<p className="text-sm text-muted-foreground">
							Profit intelligence for distributors.
						</p>
					</div>

					{/* Links */}
					<div className="flex items-center gap-6 text-sm">
						<Link
							href="#"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Privacy
						</Link>
						<Link
							href="#"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Terms
						</Link>
						<Link
							href="mailto:hello@promco.app"
							className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
						>
							<Mail className="h-4 w-4" />
							Contact
						</Link>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-8 pt-6 border-t border-border/40 text-center">
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} Promco. Built for profit.
					</p>
				</div>
			</div>
		</footer>
	);
}
