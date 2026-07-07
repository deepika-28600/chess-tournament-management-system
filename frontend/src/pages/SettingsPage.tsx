import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiUser, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../store/useAuth';
import { useTheme } from '../store/useTheme';
import { api } from '../services/apiClient';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => api.patch('/auth/profile', values),
    onSuccess: () => toast.success('Profile updated successfully'),
    onError: () => toast.error('Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password';
      toast.error(message);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FiUser /> Profile
        </h2>
        <form
          onSubmit={profileForm.handleSubmit((values) => updateProfileMutation.mutate(values))}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input className="input-field" {...profileForm.register('name')} />
            {profileForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input-field opacity-60" value={user?.email} disabled />
          </div>
          <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6"
      >
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FiLock /> Change Password
        </h2>
        <form
          onSubmit={passwordForm.handleSubmit((values) => changePasswordMutation.mutate(values))}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Current Password</label>
            <input type="password" className="input-field" {...passwordForm.register('currentPassword')} />
            {passwordForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input type="password" className="input-field" {...passwordForm.register('newPassword')} />
            {passwordForm.formState.errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
            <input type="password" className="input-field" {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
            {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card flex items-center justify-between p-6"
      >
        <div>
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark theme</p>
        </div>
        <button onClick={toggleTheme} className="btn-secondary">
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </motion.div>
    </div>
  );
}
