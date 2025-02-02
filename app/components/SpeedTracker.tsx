"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { getDistance, getSpeed } from 'geolib';
import { Circle } from 'lucide-react';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
}

const SpeedTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const calculateSpeed = useCallback((positions: Position[]) => {
    if (positions.length < 2) return 0;
    console.log(getSpeed)

    const lastTwo = positions.slice(-2);
    const distance = getDistance(
      { latitude: lastTwo[0].latitude, longitude: lastTwo[0].longitude },
      { latitude: lastTwo[1].latitude, longitude: lastTwo[1].longitude }
    );
    
    const timeInSeconds = (lastTwo[1].timestamp - lastTwo[0].timestamp) / 1000;
    const speedInMps = distance / timeInSeconds;
    const speedInKph = (speedInMps * 3.6); // Convert m/s to km/h

    return speedInKph;
  }, []);

  const updateStats = useCallback((newPositions: Position[]) => {
    if (newPositions.length < 2) return;

    // Calculate current speed
    const currentSpeedValue = calculateSpeed(newPositions);
    console.log("current Speed" ,currentSpeedValue)
    setCurrentSpeed(currentSpeedValue);

    // Update max speed
    setMaxSpeed(prev => Math.max(prev, currentSpeedValue));

    // Calculate average speed
    const speeds = newPositions.slice(1).map((_, index) => 
      calculateSpeed(newPositions.slice(index, index + 2))
    );
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    console.log("average Speed", avgSpeed)
    setAverageSpeed(avgSpeed);
  }, [calculateSpeed]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed
        };

        setPositions(prev => {
          const newPositions = [...prev, newPosition].slice(-100); // Keep last 100 positions
          updateStats(newPositions);
          return newPositions;
        });

        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">Speed Tracker</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Current Speed</p>
            <div className="text-5xl font-bold">
              {currentSpeed.toFixed(1)}
              <span className="text-xl font-normal text-gray-600 ml-1">km/h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Max Speed</p>
              <div className="text-2xl font-semibold">
                {maxSpeed.toFixed(1)}
                <span className="text-sm font-normal text-gray-600 ml-1">km/h</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Average Speed</p>
              <div className="text-2xl font-semibold">
                {averageSpeed.toFixed(1)}
                <span className="text-sm font-normal text-gray-600 ml-1">km/h</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2"
              >
                <Circle className="animate-pulse" size={20} />
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2"
              >
                <Circle size={20} />
                Stop Tracking
              </button>
            )}
          </div>
        </div>

        {isTracking && (
          <div className="mt-6">
            <p className="text-center text-sm text-gray-500">
              Tracking active... {positions.length} points collected
            </p>
            {positions.length > 0 && (
              <p className="text-center text-xs text-gray-400 mt-1">
                Last update: {new Date(positions[positions.length - 1].timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedTracker;