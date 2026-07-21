import { useState, useEffect } from 'react';

export const useHID = () => {
  const [devices, setDevices] = useState<HIDDevice[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const hidDevices = await navigator.hid.getDevices();
        setDevices(hidDevices);
      } catch (err) {
        console.error('HID Access error:', err);
      }
    };
    fetchDevices();
  }, []);

  const requestDevice = async (filters: HIDDeviceFilter[]) => {
    try {
      const newDevices = await navigator.hid.requestDevice({ filters });
      setDevices(prev => [...prev, ...newDevices]);
      return newDevices;
    } catch (err) {
      console.error('HID Request error:', err);
    }
  };

  return { devices, requestDevice };
};
