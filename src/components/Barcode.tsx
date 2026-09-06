'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import JsBarcode from 'jsbarcode';

export interface BarcodeProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Barcode({
  value,
  format = 'CODE128',
  width = 1.2,
  height = 30,
  displayValue = false,
  fontSize = 12,
  margin = 2,
  background = 'transparent',
  lineColor = '#000000',
  className,
  style,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        background,
        lineColor,
      });
    } catch (error) {
      console.error('Error al generar código de barras para el valor:', value, error);
    }
  }, [value, format, width, height, displayValue, fontSize, margin, background, lineColor]);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        ...style,
      }}
    />
  );
}
