import Link from 'next/link';
import React from 'react';
import { Button } from './ui/button';

export default function PDFGeneratorLink() {
  return (
    <Link href="/pdf-generator.html" target="_blank" rel="noopener noreferrer">
      <Button
        className="px-4 py-2"
        style={{
          cursor: 'pointer',
        }}
      >
        Open PDF Generator
      </Button>
    </Link>
  );
}
