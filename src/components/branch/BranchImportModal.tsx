import React, { useState, useRef } from 'react';
import { Upload, X, Download, AlertCircle, CheckCircle, Loader, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { useAuthStore } from '../../store/useAuthStore';

interface CSVRow {
  branch_name: string;
  branch_type: string;
  status?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedData {
  data: CSVRow[];
  errors: ValidationError[];
  validCount: number;
}

interface BranchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  existingBranches: { name: string }[];
}

export const BranchImportModal: React.FC<BranchImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingBranches
}) => {
  const { getToken, getTenantId } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setImportResult(null);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    const template = `branch_name,branch_type,status,location,contact_phone,contact_email
Main Store,retail,active,"123 Main St, City",555-0100,main@example.com
Warehouse A,warehouse,active,"456 Industrial Rd",555-0101,warehouse@example.com
Service Center,service,active,"789 Service Ave",555-0102,service@example.com`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branch_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateRow = (row: CSVRow, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.branch_name || row.branch_name.trim().length === 0) {
      errors.push({ row: rowIndex, field: 'branch_name', message: 'Branch name is required' });
    } else if (row.branch_name.length > 50) {
      errors.push({ row: rowIndex, field: 'branch_name', message: 'Branch name must be 50 characters or less' });
    }

    if (!row.branch_type || row.branch_type.trim().length === 0) {
      errors.push({ row: rowIndex, field: 'branch_type', message: 'Branch type is required' });
    }

    // Check for duplicates in existing branches
    if (row.branch_name && existingBranches.some(b => 
      b.name.toLowerCase() === row.branch_name.trim().toLowerCase()
    )) {
      errors.push({ row: rowIndex, field: 'branch_name', message: 'Branch name already exists' });
    }

    // Optional field validations
    if (row.status && !['active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push({ row: rowIndex, field: 'status', message: 'Status must be "active" or "inactive"' });
    }

    if (row.contact_email && row.contact_email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.contact_email)) {
        errors.push({ row: rowIndex, field: 'contact_email', message: 'Invalid email format' });
      }
    }

    return errors;
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsUploading(true);

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allErrors: ValidationError[] = [];
        const dataRows = results.data;

        // Check for duplicate names within CSV
        const namesSeen = new Set<string>();
        
        dataRows.forEach((row, index) => {
          const errors = validateRow(row, index + 2); // +2 for header and 1-based indexing
          allErrors.push(...errors);

          // Check for duplicates within CSV
          if (row.branch_name) {
            const normalizedName = row.branch_name.trim().toLowerCase();
            if (namesSeen.has(normalizedName)) {
              allErrors.push({
                row: index + 2,
                field: 'branch_name',
                message: 'Duplicate name within CSV'
              });
            }
            namesSeen.add(normalizedName);
          }
        });

        const validCount = dataRows.length - new Set(allErrors.map(e => e.row)).size;

        setParsedData({
          data: dataRows,
          errors: allErrors,
          validCount
        });
        setIsUploading(false);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileSelect(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleImport = async (onlyValid: boolean = true) => {
    if (!parsedData || !parsedData.data) return;

    setIsImporting(true);
    setError(null);

    try {
      const token = getToken();
      const tenantId = getTenantId();

      if (!token || !tenantId) {
        throw new Error('Authentication required');
      }

      // Filter to only valid rows if requested
      const rowsToImport = onlyValid
        ? parsedData.data.filter((_, index) => {
            const rowNumber = index + 2;
            return !parsedData.errors.some(e => e.row === rowNumber);
          })
        : parsedData.data;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branches: rowsToImport.map(row => ({
            name: row.branch_name.trim(),
            type: row.branch_type.trim(),
            status: row.status?.trim() || 'active',
            location: row.location?.trim() || '',
            contact_phone: row.contact_phone?.trim() || '',
            contact_email: row.contact_email?.trim() || ''
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import branches');
      }

      const result = await response.json();
      setImportResult({
        success: result.success || 0,
        failed: result.failed || 0
      });
      
      onImportComplete();
    } catch (err) {
      console.error('Error importing branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to import branches');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Branches</h2>
              <p className="text-sm text-gray-500">Upload a CSV file to create multiple branches</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Download Template */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">Need a template?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download our CSV template with example data and required format.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!parsedData && !importResult && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              {isUploading ? (
                <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isUploading ? 'Processing...' : 'Drop your CSV file here'}
              </p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {parsedData && !importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Validation Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{parsedData.data.length}</div>
                    <div className="text-xs text-gray-500">Total Rows</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{parsedData.validCount}</div>
                    <div className="text-xs text-gray-500">Valid</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {parsedData.data.length - parsedData.validCount}
                    </div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {parsedData.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Errors Found</h3>
                  <div className="space-y-1">
                    {parsedData.errors.slice(0, 20).map((error, index) => (
                      <div key={index} className="text-xs text-red-700">
                        Row {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                    {parsedData.errors.length > 20 && (
                      <div className="text-xs text-red-600 font-medium mt-2">
                        ... and {parsedData.errors.length - 20} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Import Complete!</h3>
              <p className="text-sm text-green-700">
                Successfully imported {importResult.success} branch{importResult.success !== 1 ? 'es' : ''}.
                {importResult.failed > 0 && ` ${importResult.failed} failed.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {!importResult ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {parsedData && (
                <button
                  onClick={() => handleImport(true)}
                  disabled={isImporting || parsedData.validCount === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import {parsedData.validCount} Valid Branches</>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
