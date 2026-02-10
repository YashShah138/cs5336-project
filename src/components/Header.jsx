import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plane, User as UserIcon, LogOut, Key, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getPasswordStrengthErrors } from '@/lib/validation';

const ROLE_LABELS = {
  administrator: 'Administrator',
  airline_staff: 'Airline Staff',
  gate_staff: 'Gate Staff',
  ground_staff: 'Ground Staff',
  passenger: 'Passenger',
};

export function Header() {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force password change modal if required
  const forcePasswordChange = user?.requiresPasswordChange === true;

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({ title: 'Logged out successfully' });
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    const errors = getPasswordStrengthErrors(newPassword);
    if (errors.length > 0) {
      toast({ title: 'Password requirements not met', description: errors.join(', '), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Password changed successfully', className: 'bg-success text-success-foreground' });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ title: result.error || 'Failed to change password', variant: 'destructive' });
    }
  };

  const isUserWithName = (u) => 'firstName' in u && 'lastName' in u;

  // Minimal header for login page (no user logged in)
  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Airport Luggage System</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  const userName = isUserWithName(user) ? `${user.firstName} ${user.lastName}` : 'User';
  const isStaffOrAdmin = user.role !== 'passenger';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Airport Luggage System</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{userName}</span>
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    ({ROLE_LABELS[user.role]})
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                  {isStaffOrAdmin && 'airlineCode' in user && user.airlineCode && (
                    <p className="text-xs text-muted-foreground">Airline: {user.airlineCode}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                {isStaffOrAdmin && (
                  <DropdownMenuItem onClick={() => setShowPasswordModal(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Password Change Dialog - forced on first login or manual */}
      <Dialog 
        open={showPasswordModal || forcePasswordChange} 
        onOpenChange={(open) => {
          // Don't allow closing if forced
          if (!forcePasswordChange) {
            setShowPasswordModal(open);
          }
        }}
      >
        <DialogContent onPointerDownOutside={forcePasswordChange ? (e) => e.preventDefault() : undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {forcePasswordChange && <AlertTriangle className="h-5 w-5 text-warning" />}
              {forcePasswordChange ? 'Password Change Required' : 'Change Password'}
            </DialogTitle>
            {forcePasswordChange && (
              <DialogDescription>
                You must change your password before continuing. This is required for all new accounts.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                6+ characters, 1 uppercase, 1 lowercase, 1 number
              </p>
              {newPassword && getPasswordStrengthErrors(newPassword).length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5">
                  {getPasswordStrengthErrors(newPassword).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            {!forcePasswordChange && (
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
            )}
            <Button onClick={handlePasswordChange} disabled={isSubmitting}>
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
