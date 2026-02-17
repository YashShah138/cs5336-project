import { getFromStorage, setToStorage, STORAGE_KEYS } from '@/lib/storage';
import { generateId } from '@/lib/generators';
import { hashPasswordSync } from '@/lib/passwordUtils';

const TEST_PASSWORD = 'Test1234';

export function seedTestData() {
  const hashedPassword = hashPasswordSync(TEST_PASSWORD);

  // Seed staff for each type
  const existingStaff = getFromStorage(STORAGE_KEYS.STAFF, []);
  const testStaff = [
    {
      id: generateId(),
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@test.com',
      phone: '1234567890',
      staffType: 'airline_staff',
      airlineCode: 'AA',
      username: 'airline01',
      password: hashedPassword,
      requiresPasswordChange: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@test.com',
      phone: '2345678901',
      staffType: 'gate_staff',
      username: 'gate01',
      password: hashedPassword,
      requiresPasswordChange: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol@test.com',
      phone: '3456789012',
      staffType: 'ground_staff',
      username: 'ground01',
      password: hashedPassword,
      requiresPasswordChange: false,
      createdAt: new Date(),
    },
  ];

  // Remove any previous test staff with same usernames
  const cleanedStaff = existingStaff.filter(
    s => !['airline01', 'gate01', 'ground01'].includes(s.username)
  );
  setToStorage(STORAGE_KEYS.STAFF, [...cleanedStaff, ...testStaff]);

  // Seed a flight
  const existingFlights = getFromStorage(STORAGE_KEYS.FLIGHTS, []);
  const testFlightId = 'test-flight-001';
  const hasTestFlight = existingFlights.some(f => f.id === testFlightId);
  if (!hasTestFlight) {
    const testFlight = {
      id: testFlightId,
      airlineCode: 'AA',
      flightNumber: '1234',
      origin: 'New York (JFK)',
      destination: 'Los Angeles (LAX)',
      departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      terminal: 'T1',
      gate: 'A1',
      createdAt: new Date(),
    };
    setToStorage(STORAGE_KEYS.FLIGHTS, [...existingFlights, testFlight]);
  }

  // Seed a passenger
  const existingPassengers = getFromStorage(STORAGE_KEYS.PASSENGERS, []);
  const testPassengerId = 'test-passenger-001';
  const hasTestPassenger = existingPassengers.some(p => p.id === testPassengerId);
  if (!hasTestPassenger) {
    const testPassenger = {
      id: testPassengerId,
      firstName: 'Dave',
      lastName: 'Passenger',
      identification: '123456',
      ticketNumber: '1234567890',
      flightId: testFlightId,
      status: 'not_checked_in',
      createdAt: new Date(),
    };
    setToStorage(STORAGE_KEYS.PASSENGERS, [...existingPassengers, testPassenger]);
  }

  return {
    admin: { username: 'admin', password: 'Admin123' },
    airline_staff: { username: 'airline01', password: TEST_PASSWORD },
    gate_staff: { username: 'gate01', password: TEST_PASSWORD },
    ground_staff: { username: 'ground01', password: TEST_PASSWORD },
    passenger: { identification: '123456', ticketNumber: '1234567890' },
  };
}
