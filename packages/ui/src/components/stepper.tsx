"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

interface StepperProps {
	currentStep: number;
	className?: string;
	children: React.ReactNode;
}

export function Stepper({ currentStep, className, children }: StepperProps) {
	const steps = React.Children.toArray(children);

	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-center justify-between">
				{steps.map((step, index) => (
					<React.Fragment key={index}>
						<div className="flex flex-col items-center">
							<div
								className={cn(
									"flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
									index < currentStep
										? "bg-green-100 border-green-600 text-green-600"
										: index === currentStep
											? "border-green-600 text-green-600"
											: "border-gray-300 text-gray-300",
								)}
							>
								{index < currentStep ? (
									<Check className="h-4 w-4" />
								) : (
									<span>{index + 1}</span>
								)}
							</div>
							{React.isValidElement<StepProps>(step) && (
								<div className="mt-2 text-center">
									<div
										className={cn(
											"text-xs font-medium",
											index <= currentStep ? "text-green-600" : "text-gray-400",
										)}
									>
										{step.props.title}
									</div>
									<div
										className={cn(
											"text-xs mt-0.5",
											index <= currentStep
												? "text-muted-foreground"
												: "text-gray-400",
										)}
									>
										{step.props.description}
									</div>
								</div>
							)}
						</div>

						{/* Connector */}
						{index < steps.length - 1 && (
							<div
								className={cn(
									"flex-1 h-0.5 mx-2",
									index < currentStep ? "bg-green-600" : "bg-gray-300",
								)}
							/>
						)}
					</React.Fragment>
				))}
			</div>
		</div>
	);
}

interface StepProps {
	title: string;
	description?: string;
}

export function Step({ title, description }: StepProps) {
	return null; // This is just a placeholder for the Stepper to use
}
