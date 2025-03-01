"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <Button variant="outline" className={className}>
      <Calendar className="h-4 w-4 mr-2" />
      Oct 18 - Nov 18
    </Button>
  );
}
