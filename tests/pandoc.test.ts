// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { convert } from 'pandoc-wasm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Pandoc WASM Format Conversions', () => {

  const sampleMdPath = resolve(__dirname, './mocks/sample.md');
  const markdownInput = readFileSync(sampleMdPath, 'utf-8');

  it('should convert Markdown to HTML successfully', async () => {
    const result = await convert({
      from: 'markdown',
      to: 'html',
      standalone: true
    }, markdownInput, {});

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Automated Test Document');
    expect(result.stdout).toContain('<strong>representative</strong>');
    expect(result.stdout).toContain('<table>');
    expect(result.stdout).toContain('<blockquote>');
  });

  it('should convert Markdown to LaTeX successfully', async () => {
    const result = await convert({
      from: 'markdown',
      to: 'latex',
      standalone: true
    }, markdownInput, {});

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('\\section{Automated Test Document}');
    expect(result.stdout).toContain('\\textbf{representative}');
    expect(result.stdout).toContain('\\begin{itemize}');
    expect(result.stdout).toContain('\\begin{longtable}');
  });

  it('should convert Markdown to RST (reStructuredText) successfully', async () => {
    const result = await convert({
      from: 'markdown',
      to: 'rst',
      standalone: true
    }, markdownInput, {});

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Automated Test Document');
    expect(result.stdout).toContain('**representative**');
    expect(result.stdout).toContain('======='); // Typical RST table/header markup
  });

  it('should convert HTML to Markdown successfully', async () => {
    const htmlInput = '<h1>Title</h1><p>Some <strong>bold</strong> text.</p>';
    
    const result = await convert({
      from: 'html',
      to: 'markdown',
      standalone: true
    }, htmlInput, {});

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('# Title');
    expect(result.stdout).toContain('**bold**');
  });

  it('should handle binary output generation (DOCX)', async () => {
    const outputFilename = 'output.docx';
    
    const result = await convert({
      from: 'markdown',
      to: 'docx',
      'output-file': outputFilename,
      standalone: true
    }, markdownInput, {});

    const outputFile = result.files[outputFilename];
    expect(outputFile).toBeDefined();
    
    if (outputFile instanceof Blob) {
      expect(outputFile.size).toBeGreaterThan(0);
    } else {
      expect(outputFile.length).toBeGreaterThan(0);
    }
  });

  it('should handle binary output generation (EPUB)', async () => {
    const outputFilename = 'output.epub';
    
    const result = await convert({
      from: 'markdown',
      to: 'epub',
      'output-file': outputFilename,
      standalone: true
    }, markdownInput, {});

    const outputFile = result.files[outputFilename];
    expect(outputFile).toBeDefined();
    
    if (outputFile instanceof Blob) {
      expect(outputFile.size).toBeGreaterThan(0);
    } else {
      expect(outputFile.length).toBeGreaterThan(0);
    }
  });

});