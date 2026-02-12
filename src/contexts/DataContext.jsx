import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFromStorage, setToStorage, STORAGE_KEYS } from '@/lib/storage';
import { generateId, generateBagId, generateUsername, generatePassword } from '@/lib/generators';
import { hashPasswordSync } from '@/lib/passwordUtils';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
  const [flights, setFlights] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [bags, setBags] = useState([]);
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [issues, setIssues] = useState([]);

  // Load initial data
  useEffect(() => {
    setFlights(getFromStorage(STORAGE_KEYS.FLIGHTS, []));
    setPassengers(getFromStorage(STORAGE_KEYS.PASSENGERS, []));
    setBags(getFromStorage(STORAGE_KEYS.BAGS, []));
    setStaff(getFromStorage(STORAGE_KEYS.STAFF, []));
    setMessages(getFromStorage(STORAGE_KEYS.MESSAGES, []));
    setIssues(getFromStorage(STORAGE_KEYS.ISSUES, []));
  }, []);

  const refreshData = useCallback(() => {
    setFlights(getFromStorage(STORAGE_KEYS.FLIGHTS, []));
    setPassengers(getFromStorage(STORAGE_KEYS.PASSENGERS, []));
    setBags(getFromStorage(STORAGE_KEYS.BAGS, []));
    setStaff(getFromStorage(STORAGE_KEYS.STAFF, []));
    setMessages(getFromStorage(STORAGE_KEYS.MESSAGES, []));
    setIssues(getFromStorage(STORAGE_KEYS.ISSUES, []));
  }, []);

  // Flights
  const addFlight = useCallback((flightData) => {
    const newFlight = {
      ...flightData,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...flights, newFlight];
    setFlights(updated);
    setToStorage(STORAGE_KEYS.FLIGHTS, updated);
    return newFlight;
  }, [flights]);

  const removeFlight = useCallback((id) => {
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

  const updateFlightGate = useCallback((id, terminal, gate) => {
    const updated = flights.map(f => f.id === id ? { ...f, terminal, gate } : f);
    setFlights(updated);
    setToStorage(STORAGE_KEYS.FLIGHTS, updated);
  }, [flights]);

  const getFlightById = useCallback((id) => flights.find(f => f.id === id), [flights]);
  const getFlightsByAirline = useCallback((airlineCode) => flights.filter(f => f.airlineCode === airlineCode), [flights]);

  // Passengers
  const addPassenger = useCallback((passengerData) => {
    const newPassenger = {
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

  const removePassenger = useCallback((id) => {
    const updated = passengers.filter(p => p.id !== id);
    setPassengers(updated);
    setToStorage(STORAGE_KEYS.PASSENGERS, updated);
    // Also remove associated bags
    const remainingBags = bags.filter(b => b.passengerId !== id);
    setBags(remainingBags);
    setToStorage(STORAGE_KEYS.BAGS, remainingBags);
  }, [passengers, bags]);

  const updatePassengerStatus = useCallback((id, status) => {
    const updated = passengers.map(p => p.id === id ? { ...p, status } : p);
    setPassengers(updated);
    setToStorage(STORAGE_KEYS.PASSENGERS, updated);
  }, [passengers]);

  const getPassengerById = useCallback((id) => passengers.find(p => p.id === id), [passengers]);
  const getPassengerByTicket = useCallback((ticketNumber) => passengers.find(p => p.ticketNumber === ticketNumber), [passengers]);
  const getPassengersByFlight = useCallback((flightId) => passengers.filter(p => p.flightId === flightId), [passengers]);

  // Bags
  const addBag = useCallback((bagData) => {
    const now = new Date();
    const newBag = {
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

  const updateBagLocation = useCallback((id, location, gateNumber, updatedBy) => {
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

  const removeBag = useCallback((id) => {
    const updated = bags.filter(b => b.id !== id);
    setBags(updated);
    setToStorage(STORAGE_KEYS.BAGS, updated);
  }, [bags]);

  const getBagById = useCallback((bagId) => bags.find(b => b.bagId === bagId), [bags]);
  const getBagsByPassenger = useCallback((passengerId) => bags.filter(b => b.passengerId === passengerId), [bags]);
  const getBagsByFlight = useCallback((flightId) => bags.filter(b => b.flightId === flightId), [bags]);
  const getBagsByLocation = useCallback((location) => bags.filter(b => b.location === location), [bags]);

  // Staff - password is hashed before storage
  const addStaff = useCallback((staffData) => {
    const username = generateUsername();
    const plainPassword = generatePassword();
    const newStaff = {
      ...staffData,
      id: generateId(),
      username,
      password: hashPasswordSync(plainPassword),
      requiresPasswordChange: true,
      createdAt: new Date(),
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    setToStorage(STORAGE_KEYS.STAFF, updated);
    // Return plain credentials for email sending only - never stored in plain text
    return { staff: newStaff, username, password: plainPassword };
  }, [staff]);

  const removeStaff = useCallback((id) => {
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    setToStorage(STORAGE_KEYS.STAFF, updated);
  }, [staff]);

  const getStaffByType = useCallback((type) => staff.filter(s => s.staffType === type), [staff]);

  // Messages
  const addMessage = useCallback((messageData) => {
    const newMessage = {
      ...messageData,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...messages, newMessage];
    setMessages(updated);
    setToStorage(STORAGE_KEYS.MESSAGES, updated);
    return newMessage;
  }, [messages]);

  const getMessagesByBoard = useCallback((boardType) => 
    messages.filter(m => m.boardType === boardType).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [messages]);

  // Issues
  const addIssue = useCallback((issueData) => {
    const newIssue = {
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
      flights, addFlight, removeFlight, updateFlightGate, getFlightById, getFlightsByAirline,
      passengers, addPassenger, removePassenger, updatePassengerStatus, getPassengerById, getPassengerByTicket, getPassengersByFlight,
      bags, addBag, removeBag, updateBagLocation, getBagById, getBagsByPassenger, getBagsByFlight, getBagsByLocation,
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
