import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/useAuthStore';
import { CheckCircle, AlertCircle, Plus, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface BranchFormData {
  name: string;
  type: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
}

interface Branch {
  id: string;
  name: string;
  type?: string;
}

interface BranchCreateFormProps {
  existingBranches: Branch[];
  onBranchCreated: () => void;
  focusTrigger?: number;
}

export const BranchCreateForm: React.FC<BranchCreateFormProps> = ({
  existingBranches,
  onBranchCreated,
  focusTrigger
}) => {
  const { getToken, getTenantId } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<BranchFormData>();

  const watchName = watch('name', '');
  const watchType = watch('type', '');

  // Get unique branch types from existing branches
  const existingTypes = Array.from(
    new Set(existingBranches.map(b => b.type).filter(Boolean))
  ).sort();

  // Predefined branch types
  const predefinedTypes = [
    'retail',
    'warehouse',
    'service',
    'office',
    'manufacturing',
    'distribution'
  ];

  // Combine predefined and custom types
  const allTypes = Array.from(new Set([...predefinedTypes, ...existingTypes])).sort();

  // Focus management
  useEffect(() => {
    if (focusTrigger && focusTrigger > 0) {
      nameInputRef.current?.focus();
    }
  }, [focusTrigger]);

  // Check for duplicate names
  const isDuplicateName = watchName.trim().length > 0 &&
    existingBranches.some(b => 
      b.name.toLowerCase() === watchName.trim().toLowerCase()
    );

  const onSubmit = async (data: BranchFormData, addAnother: boolean = false) => {
    if (isDuplicateName) {
      setError('A branch with this name already exists');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const tenantId = getTenantId();

      if (!token || !tenantId) {
        throw new Error('Authentication required');
      }

      const branchType = watchType === 'custom' ? newTypeInput : data.type;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name.trim(),
          type: branchType,
          location: data.location?.trim() || '',
          contact_phone: data.contact_phone?.trim() || '',
          contact_email: data.contact_email?.trim() || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create branch');
      }

      const createdBranch = await response.json();
      setSuccess(`Branch "${createdBranch.name}" created successfully!`);
      
      // Reset form
      reset();
      setNewTypeInput('');
      setShowNewTypeInput(false);
      setShowAdvanced(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify parent
      onBranchCreated();

      // If not adding another, we're done
      if (!addAnother) {
        // Focus can return to name field for next entry
        document.getElementById('branch-name')?.focus();
      }
    } catch (err) {
      console.error('Error creating branch:', err);
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'custom') {
      setShowNewTypeInput(true);
    } else {
      setShowNewTypeInput(false);
      setNewTypeInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-4">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Branch Name */}
      <div>
        <label htmlFor="branch-name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          Branch Name <span className="text-red-500">*</span>
          <span className="group relative">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
            <span className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-48 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
              Unique name for this branch location
            </span>
          </span>
        </label>
        <input
          id="branch-name"
          ref={nameInputRef}
          type="text"
          {...register('name', {
            required: 'Branch name is required',
            maxLength: {
              value: 50,
              message: 'Branch name must be 50 characters or less'
            },
            validate: (value) => {
              if (value.trim().length === 0) {
                return 'Branch name cannot be empty';
              }
              return true;
            }
          })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name || isDuplicateName ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Main Store"
          disabled={isSubmitting}
          aria-describedby="branch-name-help"
        />
        <div className="mt-1 flex items-center justify-between">
          <div>
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
            {isDuplicateName && !errors.name && (
              <p className="text-xs text-red-600">A branch with this name already exists</p>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {watchName.length}/50
          </span>
        </div>
      </div>

      {/* Branch Type */}
      <div>
        <label htmlFor="branch-type" className="block text-sm font-medium text-gray-700 mb-1">
          Branch Type <span className="text-red-500">*</span>
        </label>
        <select
          id="branch-type"
          {...register('type', { required: 'Branch type is required' })}
          onChange={handleTypeChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.type ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        >
          <option value="">Select a type...</option>
          {allTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
          <option value="custom">+ Add new type</option>
        </select>
        {errors.type && (
          <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* New Type Input */}
      {showNewTypeInput && (
        <div>
          <label htmlFor="new-type" className="block text-sm font-medium text-gray-700 mb-1">
            New Branch Type
          </label>
          <input
            id="new-type"
            type="text"
            value={newTypeInput}
            onChange={(e) => setNewTypeInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., franchise"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isDuplicateName || !watchName.trim() || !watchType || (watchType === 'custom' && !newTypeInput.trim())}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Creating...' : 'Create Branch'}
        </button>
        
        <button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, true))}
          disabled={isSubmitting || isDuplicateName || !watchName.trim() || !watchType || (watchType === 'custom' && !newTypeInput.trim())}
          className="w-full bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create & Add Another
        </button>

        <button
          type="button"
          onClick={() => {
            reset();
            setNewTypeInput('');
            setShowNewTypeInput(false);
            setShowAdvanced(false);
            setError(null);
            setSuccess(null);
          }}
          disabled={isSubmitting}
          className="w-full text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Reset
        </button>
      </div>

      {/* Advanced Fields Section */}
      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location/Address
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 123 Main St, City"
                disabled={isSubmitting}
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                {...register('contact_phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 555-0100"
                disabled={isSubmitting}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                id="contact-email"
                type="email"
                {...register('contact_email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format'
                  }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contact_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., branch@example.com"
                disabled={isSubmitting}
              />
              {errors.contact_email && (
                <p className="text-xs text-red-600 mt-1">{errors.contact_email.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
};
