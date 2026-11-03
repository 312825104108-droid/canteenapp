import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const departments = [
  'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
  'Civil Engineering', 'Information Technology', 'Electrical Engineering',
  'Chemical Engineering', 'Biomedical Engineering', 'MBA', 'MCA',
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year'];

export const ProfileSetupScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeProfile, user } = useAuthStore();
  const email = user?.email || location.state?.email || '';

  const [form, setForm] = useState({
    name: '',
    department: '',
    year: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isValid = form.name && form.department && form.year;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      await completeProfile(form);
      toast.success('Profile created! Welcome to Sri Sai Cafe.');
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not save your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="header-gradient px-6 pt-14 pb-8">
          <h2 className="text-2xl font-bold text-ink-primary">Complete Profile</h2>
          <p className="text-ink-secondary mt-1">We need a few details to set up your account</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 px-6 pt-6 pb-8 flex flex-col gap-5"
        >
          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-ink-secondary mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" size={18} />
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Arjun Krishnan"
                className="w-full h-[52px] pl-12 pr-4 border-2 border-surface-border rounded-card
                           text-base text-ink-primary bg-white focus:border-primary-500
                           placeholder:text-ink-disabled"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-semibold text-ink-secondary mb-2 block">Department</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" size={18} />
              <select
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className="w-full h-[52px] pl-12 pr-4 border-2 border-surface-border rounded-card
                           text-base text-ink-primary bg-white focus:border-primary-500
                           appearance-none cursor-pointer"
              >
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="text-sm font-semibold text-ink-secondary mb-2 block">Year of Study</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" size={18} />
              <select
                value={form.year}
                onChange={e => set('year', e.target.value)}
                className="w-full h-[52px] pl-12 pr-4 border-2 border-surface-border rounded-card
                           text-base text-ink-primary bg-white focus:border-primary-500
                           appearance-none cursor-pointer"
              >
                <option value="">Select year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-semibold text-ink-secondary mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-[52px] px-4 border-2 border-surface-border rounded-card
                         text-base text-ink-secondary bg-surface-bg cursor-not-allowed"
            />
          </div>

          <div className="mt-2">
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={!isValid}
              fullWidth
              size="lg"
            >
              Complete Setup
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSetupScreen;
