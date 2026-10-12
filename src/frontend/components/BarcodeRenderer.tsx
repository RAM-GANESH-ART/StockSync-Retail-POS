"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeRendererProps {
  value: string;
  format?: "CODE128" | "EAN13" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  lineColor?: string;
}

export function BarcodeRenderer({
  value,
  format = "CODE128",
  width = 1.6,
  height = 36,
  displayValue = true,
  fontSize = 11,
  className = "",
  lineColor = "#000000",
}: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          font: "monospace",
          lineColor,
          margin: 4,
          background: "transparent",
        });
      } catch (err) {
        console.warn("Barcode rendering error (falling back):", err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize, lineColor]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
