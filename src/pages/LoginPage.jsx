import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Plane, User, Users, Briefcase, ShieldCheck, Loader2 } from 'lucide-react';
import { validateIdentification, validateTicketNumber } from '@/lib/validation';

const userTypeOptions = [
  { value: 'administrator', label: 'Administrator', icon: <ShieldCheck className="h-5 w-5" />, description: 'System administration' },
  { value: 'airline_staff', label: 'Airline Staff', icon: <Plane className="h-5 w-5" />, description: 'Check-in & bag management' },
  { value: 'gate_staff', label: 'Gate Staff', icon: <Users className="h-5 w-5" />, description: 'Boarding management' },
  { value: 'ground_staff', label: 'Ground Staff', icon: <Briefcase className="h-5 w-5" />, description: 'Security & loading' },
  { value: 'passenger', label: 'Passenger', icon: <User className="h-5 w-5" />, description: 'Track your luggage' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [userType, setUserType] = useState('administrator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [identification, setIdentification] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (userType === 'passenger') {
      if (!validateIdentification(identification)) {
        newErrors.identification = 'Identification must be exactly 6 digits';
      }
      if (!validateTicketNumber(ticketNumber)) {
        newErrors.ticketNumber = 'Ticket number must be exactly 10 digits';
      }
    } else {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    const credentials = userType === 'passenger' 
      ? { identification, ticketNumber }
      : { username, password };

    const result = await login(userType, credentials);
    setIsLoading(false);

    if (result.success) {
      toast({ 
        title: 'Login successful', 
        description: `Welcome back!`,
        className: 'bg-success text-success-foreground'
      });
      
      // Navigate to appropriate dashboard
      const routes = {
        administrator: '/admin',
        airline_staff: '/airline-staff',
        gate_staff: '/gate-staff',
        ground_staff: '/ground-staff',
        passenger: '/passenger',
      };
      navigate(routes[userType]);
    } else {
      toast({ 
        title: 'Login failed', 
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const isPassenger = userType === 'passenger';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Airport Luggage System</CardTitle>
          <CardDescription>Sign in to access the management portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Select User Type</Label>
              <RadioGroup
                value={userType}
                onValueChange={(value) => {
                  setUserType(value);
                  setErrors({});
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {userTypeOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                      userType === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      userType === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Login Fields */}
            <div className="space-y-4">
              {isPassenger ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="identification">Identification (6 digits)</Label>
                    <Input
                      id="identification"
                      type="text"
                      placeholder="Enter 6-digit ID"
                      value={identification}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setIdentification(value);
                        if (errors.identification) setErrors({ ...errors, identification: '' });
                      }}
                      className={errors.identification ? 'border-destructive' : ''}
                    />
                    {errors.identification && (
                      <p className="text-xs text-destructive">{errors.identification}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketNumber">Ticket Number (10 digits)</Label>
                    <Input
                      id="ticketNumber"
                      type="text"
                      placeholder="Enter 10-digit ticket number"
                      value={ticketNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setTicketNumber(value);
                        if (errors.ticketNumber) setErrors({ ...errors, ticketNumber: '' });
                      }}
                      className={errors.ticketNumber ? 'border-destructive' : ''}
                    />
                    {errors.ticketNumber && (
                      <p className="text-xs text-destructive">{errors.ticketNumber}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors({ ...errors, username: '' });
                      }}
                      className={errors.username ? 'border-destructive' : ''}
                    />
                    {errors.username && (
                      <p className="text-xs text-destructive">{errors.username}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {userType === 'administrator' && (
              <p className="text-center text-xs text-muted-foreground">
                Default credentials: admin / Admin123
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
