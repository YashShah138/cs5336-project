import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Flight, Passenger, Bag, Staff, Message, Issue, BagLocation, PassengerStatus, StaffType, MessageBoardType, IssueType } from '@/types';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '@/lib/storage';
import { generateId, generateBagId, generateUsername, generatePassword } from '@/lib/generators';

interface DataContextType {
  // Flights
  flights: Flight[];
  addFlight: (flight: Omit<Flight, 'id' | 'createdAt'>) => Flight;
  removeFlight: (id: string) => void;
  getFlightById: (id: string) => Flight | undefined;
  getFlightsByAirline: (airlineCode: string) => Flight[];
  
  // Passengers
  passengers: Passenger[];
  addPassenger: (passenger: Omit<Passenger, 'id' | 'status' | 'createdAt'>) => Passenger;
  removePassenger: (id: string) => void;
  updatePassengerStatus: (id: string, status: PassengerStatus) => void;
  getPassengerById: (id: string) => Passenger | undefined;
  getPassengerByTicket: (ticketNumber: string) => Passenger | undefined;
  getPassengersByFlight: (flightId: string) => Passenger[];
  
  // Bags
  bags: Bag[];
  addBag: (bag: Omit<Bag, 'id' | 'createdAt' | 'updatedAt' | 'locationHistory'>) => Bag;
  updateBagLocation: (id: string, location: BagLocation, gateNumber?: string, updatedBy?: string) => void;
  getBagById: (bagId: string) => Bag | undefined;
  getBagsByPassenger: (passengerId: string) => Bag[];
  getBagsByFlight: (flightId: string) => Bag[];
  getBagsByLocation: (location: BagLocation) => Bag[];
  
  // Staff
  staff: Staff[];
  addStaff: (staff: Omit<Staff, 'id' | 'username' | 'password' | 'requiresPasswordChange' | 'createdAt'>) => { staff: Staff; username: string; password: string };
  removeStaff: (id: string) => void;
  getStaffByType: (type: StaffType) => Staff[];
  
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Message;
  getMessagesByBoard: (boardType: MessageBoardType) => Message[];
  
  // Issues
  issues: Issue[];
  addIssue: (issue: Omit<Issue, 'id' | 'createdAt'>) => Issue;
  
  // Utilities
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  // Load initial data
  useEffect(() => {
    setFlights(getFromStorage<Flight[]>(STORAGE_KEYS.FLIGHTS, []));
    setPassengers(getFromStorage<Passenger[]>(STORAGE_KEYS.PASSENGERS, []));
    setBags(getFromStorage<Bag[]>(STORAGE_KEYS.BAGS, []));
    setStaff(getFromStorage<Staff[]>(STORAGE_KEYS.STAFF, []));
    setMessages(getFromStorage<Message[]>(STORAGE_KEYS.MESSAGES, []));
    setIssues(getFromStorage<Issue[]>(STORAGE_KEYS.ISSUES, []));
  }, []);

  const refreshData = useCallback(() => {
    setFlights(getFromStorage<Flight[]>(STORAGE_KEYS.FLIGHTS, []));
    setPassengers(getFromStorage<Passenger[]>(STORAGE_KEYS.PASSENGERS, []));
    setBags(getFromStorage<Bag[]>(STORAGE_KEYS.BAGS, []));
    setStaff(getFromStorage<Staff[]>(STORAGE_KEYS.STAFF, []));
    setMessages(getFromStorage<Message[]>(STORAGE_KEYS.MESSAGES, []));
    setIssues(getFromStorage<Issue[]>(STORAGE_KEYS.ISSUES, []));
  }, []);

  // Flights
  const addFlight = useCallback((flightData: Omit<Flight, 'id' | 'createdAt'>): Flight => {
    const newFlight: Flight = {
      ...flightData,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...flights, newFlight];
    setFlights(updated);
    setToStorage(STORAGE_KEYS.FLIGHTS, updated);
    return newFlight;
  }, [flights]);

  const removeFlight = useCallback((id: string) => {
    const updated = flights.filter(f => f.id !== id);
    setFlights(updated);
    setToStorage(STORAGE_KEYS.FLIGHTS, updated);
    // Also remove associated passengers and bags
    const remainingPassengers = passengers.filter(p => p.flightId !== id);
    setPassengers(remainingPassengers);
    setToStorage(STORAGE_KEYS.PASSENGERS, remainingPassengers);
    const remainingBags = bags.filter(b => b.flightId !== id);
    setBags(remainingBags);
    setToStorage(STORAGE_KEYS.BAGS, remainingBags);
  }, [flights, passengers, bags]);

  const getFlightById = useCallback((id: string) => flights.find(f => f.id === id), [flights]);
  const getFlightsByAirline = useCallback((airlineCode: string) => flights.filter(f => f.airlineCode === airlineCode), [flights]);

  // Passengers
  const addPassenger = useCallback((passengerData: Omit<Passenger, 'id' | 'status' | 'createdAt'>): Passenger => {
    const newPassenger: Passenger = {
      ...passengerData,
      id: generateId(),
      status: 'not_checked_in',
      createdAt: new Date(),
    };
    const updated = [...passengers, newPassenger];
    setPassengers(updated);
    setToStorage(STORAGE_KEYS.PASSENGERS, updated);
    return newPassenger;
  }, [passengers]);

  const removePassenger = useCallback((id: string) => {
    const updated = passengers.filter(p => p.id !== id);
    setPassengers(updated);
    setToStorage(STORAGE_KEYS.PASSENGERS, updated);
    // Also remove associated bags
    const remainingBags = bags.filter(b => b.passengerId !== id);
    setBags(remainingBags);
    setToStorage(STORAGE_KEYS.BAGS, remainingBags);
  }, [passengers, bags]);

  const updatePassengerStatus = useCallback((id: string, status: PassengerStatus) => {
    const updated = passengers.map(p => p.id === id ? { ...p, status } : p);
    setPassengers(updated);
    setToStorage(STORAGE_KEYS.PASSENGERS, updated);
  }, [passengers]);

  const getPassengerById = useCallback((id: string) => passengers.find(p => p.id === id), [passengers]);
  const getPassengerByTicket = useCallback((ticketNumber: string) => passengers.find(p => p.ticketNumber === ticketNumber), [passengers]);
  const getPassengersByFlight = useCallback((flightId: string) => passengers.filter(p => p.flightId === flightId), [passengers]);

  // Bags
  const addBag = useCallback((bagData: Omit<Bag, 'id' | 'createdAt' | 'updatedAt' | 'locationHistory'>): Bag => {
    const now = new Date();
    const newBag: Bag = {
      ...bagData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      locationHistory: [{ location: bagData.location, timestamp: now }],
    };
    const updated = [...bags, newBag];
    setBags(updated);
    setToStorage(STORAGE_KEYS.BAGS, updated);
    return newBag;
  }, [bags]);

  const updateBagLocation = useCallback((id: string, location: BagLocation, gateNumber?: string, updatedBy?: string) => {
    const now = new Date();
    const updated = bags.map(b => {
      if (b.id === id) {
        return {
          ...b,
          location,
          gateNumber: gateNumber || b.gateNumber,
          updatedAt: now,
          locationHistory: [...b.locationHistory, { location, timestamp: now, updatedBy }],
        };
      }
      return b;
    });
    setBags(updated);
    setToStorage(STORAGE_KEYS.BAGS, updated);
  }, [bags]);

  const getBagById = useCallback((bagId: string) => bags.find(b => b.bagId === bagId), [bags]);
  const getBagsByPassenger = useCallback((passengerId: string) => bags.filter(b => b.passengerId === passengerId), [bags]);
  const getBagsByFlight = useCallback((flightId: string) => bags.filter(b => b.flightId === flightId), [bags]);
  const getBagsByLocation = useCallback((location: BagLocation) => bags.filter(b => b.location === location), [bags]);

  // Staff
  const addStaff = useCallback((staffData: Omit<Staff, 'id' | 'username' | 'password' | 'requiresPasswordChange' | 'createdAt'>) => {
    const username = generateUsername();
    const password = generatePassword();
    const newStaff: Staff = {
      ...staffData,
      id: generateId(),
      username,
      password,
      requiresPasswordChange: true,
      createdAt: new Date(),
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    setToStorage(STORAGE_KEYS.STAFF, updated);
    return { staff: newStaff, username, password };
  }, [staff]);

  const removeStaff = useCallback((id: string) => {
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    setToStorage(STORAGE_KEYS.STAFF, updated);
  }, [staff]);

  const getStaffByType = useCallback((type: StaffType) => staff.filter(s => s.staffType === type), [staff]);

  // Messages
  const addMessage = useCallback((messageData: Omit<Message, 'id' | 'createdAt'>): Message => {
    const newMessage: Message = {
      ...messageData,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...messages, newMessage];
    setMessages(updated);
    setToStorage(STORAGE_KEYS.MESSAGES, updated);
    return newMessage;
  }, [messages]);

  const getMessagesByBoard = useCallback((boardType: MessageBoardType) => 
    messages.filter(m => m.boardType === boardType).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [messages]);

  // Issues
  const addIssue = useCallback((issueData: Omit<Issue, 'id' | 'createdAt'>): Issue => {
    const newIssue: Issue = {
      ...issueData,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...issues, newIssue];
    setIssues(updated);
    setToStorage(STORAGE_KEYS.ISSUES, updated);
    return newIssue;
  }, [issues]);

  return (
    <DataContext.Provider value={{
      flights, addFlight, removeFlight, getFlightById, getFlightsByAirline,
      passengers, addPassenger, removePassenger, updatePassengerStatus, getPassengerById, getPassengerByTicket, getPassengersByFlight,
      bags, addBag, updateBagLocation, getBagById, getBagsByPassenger, getBagsByFlight, getBagsByLocation,
      staff, addStaff, removeStaff, getStaffByType,
      messages, addMessage, getMessagesByBoard,
      issues, addIssue,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
