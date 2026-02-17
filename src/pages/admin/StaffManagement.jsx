import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { validateName, validateEmail, validatePhone, validateAirlineCode } from '@/lib/validation';
import { Plus, Trash2, Check, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STAFF_TYPE_LABELS = {
  airline_staff: 'Airline Staff',
  gate_staff: 'Gate Staff',
  ground_staff: 'Ground Staff',
};

export default function StaffManagement() {
  const { flights, addStaff, removeStaff, getStaffByType } = useData();
  const { toast } = useToast();

  // Unique airline codes from flights
  const airlineCodes = useMemo(() => {
    const codes = new Set(flights.map(f => f.airlineCode));
    return Array.from(codes);
  }, [flights]);

  // Current tab
  const [currentTab, setCurrentTab] = useState('airline_staff');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  const [errors, setErrors] = useState({});

  // Credentials modal
  const [credentials, setCredentials] = useState(null);

  // Delete state
  const [deleteStaffId, setDeleteStaffId] = useState(null);

  const requiresAirline = currentTab !== 'ground_staff';

  const validateForm = () => {
    const newErrors = {};

    if (!validateName(firstName)) {
      newErrors.firstName = 'Minimum 2 letters required';
    }
    if (!validateName(lastName)) {
      newErrors.lastName = 'Minimum 2 letters required';
    }
    if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format (XXX@XXX.XXX)';
    }
    if (!validatePhone(phone)) {
      newErrors.phone = '10 digits, first digit cannot be 0';
    }
    if (requiresAirline && !validateAirlineCode(airlineCode)) {
      newErrors.airlineCode = 'Must be exactly 2 letters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = addStaff({
      firstName,
      lastName,
      email,
      phone,
      staffType: currentTab,
      airlineCode: requiresAirline ? airlineCode.toUpperCase() : undefined,
    });

    setCredentials({ email });
    toast({ title: 'Staff member added successfully', className: 'bg-success text-success-foreground' });
    
    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAirlineCode('');
    setErrors({});
  };


  const handleDeleteStaff = () => {
    if (deleteStaffId) {
      removeStaff(deleteStaffId);
      toast({ title: 'Staff member removed successfully', className: 'bg-success text-success-foreground' });
      setDeleteStaffId(null);
    }
  };

  const staffList = getStaffByType(currentTab);

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="airline_staff">Airline Staff</TabsTrigger>
          <TabsTrigger value="gate_staff">Gate Staff</TabsTrigger>
          <TabsTrigger value="ground_staff">Ground Staff</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="space-y-6 mt-6">
          {/* Add Staff Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New {STAFF_TYPE_LABELS[currentTab]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStaff} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@airline.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (10 digits)</Label>
                  <Input
                    id="phone"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                {requiresAirline && (
                  <div className="space-y-2">
                    <Label htmlFor="airlineCode">Airline Code</Label>
                    <Input
                      id="airlineCode"
                      placeholder="AA"
                      value={airlineCode}
                      onChange={(e) => setAirlineCode(e.target.value.toUpperCase().slice(0, 2))}
                      className={errors.airlineCode ? 'border-destructive' : ''}
                    />
                    {errors.airlineCode && <p className="text-xs text-destructive">{errors.airlineCode}</p>}
                  </div>
                )}
                <div className={`${requiresAirline ? 'lg:col-span-5' : 'lg:col-span-4'} flex justify-end`}>
                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Staff
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card>
            <CardHeader>
              <CardTitle>{STAFF_TYPE_LABELS[currentTab]} ({staffList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      {requiresAirline && <TableHead>Airline</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={requiresAirline ? 6 : 5} className="text-center text-muted-foreground py-8">
                          No {STAFF_TYPE_LABELS[currentTab].toLowerCase()} found
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffList.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono">{member.username}</TableCell>
                          <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          {requiresAirline && (
                            <TableCell>
                              <Badge variant="outline">{member.airlineCode}</Badge>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteStaffId(member.id)}
                              className="text-destructive hover:text-destructive"
                              title="Remove Staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credentials Sent Confirmation Modal */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Staff Account Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
              <Check className="h-6 w-6 text-success flex-shrink-0" />
              <div>
                <p className="font-medium">Credentials sent via email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Login credentials (username and password) have been sent to <span className="font-medium text-foreground">{credentials?.email}</span>.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The staff member will be required to change their password on first login.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteStaffId}
        onOpenChange={() => setDeleteStaffId(null)}
        title="Remove Staff Member"
        description={`Are you sure you want to remove the staff member "${(() => { const s = staffList.find(s => s.id === deleteStaffId); return s ? `${s.firstName} ${s.lastName}` : ''; })()}"? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteStaff}
        isDestructive
      />
    </div>
  );
}
