import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRegisterTenant } from '../lib/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organizationName: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.adminUsername.trim()) {
      setError('Admin username is required');
      return false;
    }
    if (formData.adminUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.adminPassword) {
      setError('Password is required');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiRegisterTenant({
        organizationName: formData.organizationName,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
        adminEmail: formData.adminEmail || undefined,
      });
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your organization has been created. Redirecting to login...
          </p>
          <p className="text-sm text-gray-500">
            Use your admin credentials to login: <strong>{formData.adminUsername}</strong>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Register Your Business</h1>
          <p className="text-gray-600 mt-2">Create your organization account to get started</p>
        </div>

        {/* Registration Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="organizationName"
                  type="text"
                  placeholder="Your Business Name"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Admin Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="adminUsername"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Admin Email (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="adminPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="text-2xl mb-1">🏪</div>
            <p className="text-xs text-gray-600">Multi-Branch Support</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-gray-600">Real-time Analytics</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-600">Secure & Private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
