import React, { useRef, useState } from 'react';
import { Upload, Download, AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { parseCsvMembers, SAMPLE_CSV_TEMPLATE } from '@/lib/csvImport';
import type { CsvMemberRow, ParseResult } from '@/lib/csvImport';

interface CsvImportProps {
  onImport: (members: CsvMemberRow[]) => void;
  onCancel?: () => void;
}

function downloadTemplate() {
  const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'baraza-members-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-primary/15 text-primary',
  treasurer: 'bg-accent/15 text-accent',
  member: 'bg-muted text-muted-foreground',
};

const CsvImport: React.FC<CsvImportProps> = ({ onImport, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);

  function processFile(file: File) {
    setFileName(file.name);
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setResult(parseCsvMembers(text));
      }
      setIsParsing(false);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleImport() {
    if (result && result.valid.length > 0) {
      onImport(result.valid);
    }
  }

  const hasValid = result && result.valid.length > 0;
  const hasErrors = result && result.errors.length > 0;

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-surface/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="sr-only"
          onChange={handleFileChange}
        />
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {fileName ? fileName : 'Drop your CSV here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Accepts .csv or .txt files</p>
        </div>
      </label>

      {/* Template download */}
      <button
        type="button"
        onClick={downloadTemplate}
        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Download sample template
      </button>

      {/* Parsing indicator */}
      {isParsing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Parsing file…
        </div>
      )}

      {/* Results */}
      {result && !isParsing && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {result.valid.length} valid member{result.valid.length !== 1 ? 's' : ''}
              </span>
            </div>
            {hasErrors && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground px-3 py-2">
              {result.totalRows} row{result.totalRows !== 1 ? 's' : ''} scanned
            </div>
          </div>

          {/* Valid rows table */}
          {hasValid && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Phone</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.valid.map((row, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-surface/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{row.phone}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_BADGE[row.role ?? 'member'] ?? ROLE_BADGE.member}`}>
                            {row.role ?? 'member'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error list (collapsible) */}
          {hasErrors && (
            <div className="rounded-xl border border-destructive/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setErrorsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-destructive/5 hover:bg-destructive/10 transition-colors text-sm font-semibold text-destructive"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} with errors
                </span>
                {errorsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {errorsOpen && (
                <div className="max-h-40 overflow-y-auto divide-y divide-border/50">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-xs">
                      <span className="shrink-0 font-mono text-muted-foreground">Row {err.row}</span>
                      <span className="font-medium text-foreground capitalize">{err.field}:</span>
                      <span className="text-muted-foreground">{err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleImport}
          disabled={!hasValid || isParsing}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hasValid
            ? `Import ${result.valid.length} Member${result.valid.length !== 1 ? 's' : ''}`
            : 'Import Members'}
        </button>
      </div>
    </div>
  );
};

export default CsvImport;
