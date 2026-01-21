'use client';

import { useEffect, useState } from 'react';

const COOKING_STEPS = [
  { text: 'Preheating the oven', icon: '🔥' },
  { text: 'Gathering fresh ingredients', icon: '🥬' },
  { text: 'Chopping the vegetables', icon: '🔪' },
  { text: 'Seasoning to perfection', icon: '🧂' },
  { text: 'Heating up the pan', icon: '🍳' },
  { text: 'Simmering the sauce', icon: '🍲' },
  { text: 'Tasting for flavor', icon: '👨‍🍳' },
  { text: 'Adding the finishing touches', icon: '✨' },
  { text: 'Plating your meals', icon: '🍽️' },
];

interface CookingLoaderProps {
  isVisible: boolean;
}

export default function CookingLoader({ isVisible }: CookingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setDots('');
      return;
    }

    // Cycle through steps every 2.5 seconds
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % COOKING_STEPS.length);
    }, 2500);

    // Animate dots every 400ms
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const step = COOKING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {/* Animated cooking icon */}
        <div className="text-6xl mb-6 animate-bounce">
          {step.icon}
        </div>

        {/* Step text with animated dots */}
        <p className="text-xl text-gray-700 font-medium min-h-[2rem]">
          {step.text}
          <span className="inline-block w-8 text-left">{dots}</span>
        </p>

        {/* Progress indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {COOKING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-600 scale-125'
                  : index < currentStep
                  ? 'bg-blue-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Subtle hint */}
        <p className="mt-6 text-sm text-gray-500">
          Creating your personalized meal plan
        </p>
      </div>
    </div>
  );
}
