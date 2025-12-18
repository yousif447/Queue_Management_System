"use client";

import { useSocket } from '@/contexts/SocketContext';
import { Clock, MapPin, TrendingUp, Users, Wifi, WifiOff, PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function QueuePositionTracker({ ticketId, queueId }) {
  const { socket, connected } = useSocket();
  const [queueData, setQueueData] = useState({
    position: null,
    totalInQueue: 0,
    estimatedWait: 0,
    currentServing: null,
    status: 'waiting',
  });

  useEffect(() => {
    if (!socket || !ticketId || !queueId) return;

    socket.emit('joinQueue', { queueId, ticketId });

    socket.on('positionUpdate', (data) => {
      if (data.ticketId === ticketId) {
        setQueueData(prev => ({ ...prev, position: data.position, totalInQueue: data.totalInQueue, estimatedWait: data.estimatedWait }));
      }
    });

    socket.on('queueStatus', (data) => {
      if (data.queueId === queueId) {
        setQueueData(prev => ({ ...prev, currentServing: data.currentServing, totalInQueue: data.totalInQueue }));
      }
    });

    socket.on('yourTurn', (data) => {
      if (data.ticketId === ticketId) {
        setQueueData(prev => ({ ...prev, status: 'ready', position: 0 }));
      }
    });

    return () => {
      socket.emit('leaveQueue', { queueId, ticketId });
      socket.off('positionUpdate');
      socket.off('queueStatus');
      socket.off('yourTurn');
    };
  }, [socket, ticketId, queueId]);

  if (!ticketId || !queueId) {
    return (
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6 text-center">
        <p className="text-amber-700 dark:text-amber-400 font-medium">No active ticket found</p>
      </div>
    );
  }

  const progress = queueData.position && queueData.totalInQueue > 0 
    ? Math.round(((queueData.totalInQueue - queueData.position) / queueData.totalInQueue) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl p-6 space-y-6 border border-gray-200 dark:border-gray-700/50">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Queue Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          connected 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30' 
            : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
        }`}>
          {connected ? <Wifi size={14} className="text-emerald-600 dark:text-emerald-400" /> : <WifiOff size={14} className="text-red-600 dark:text-red-400" />}
          <span className={`text-sm font-medium ${connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Your Position - Main Display */}
      {queueData.status === 'ready' ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-10 text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
              <PartyPopper size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">It's Your Turn!</h2>
            <p className="text-white/80 text-lg">Please proceed to the counter</p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-10 text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-2">Your Position</p>
            <div className="text-7xl font-bold text-white mb-2">
              #{queueData.position || '...'}
            </div>
            <p className="text-white/80 text-sm">in the queue</p>
          </div>
        </div>
      )}

      {/* Queue Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Estimated Wait Time */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Est. Wait</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {queueData.estimatedWait || 0}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">min</span>
          </p>
        </div>

        {/* People in Queue */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">In Queue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {queueData.totalInQueue || 0}
          </p>
        </div>
      </div>

      {/* Currently Serving */}
      {queueData.currentServing && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">Now Serving</span>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">#{queueData.currentServing}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Visualization */}
      {queueData.position && queueData.totalInQueue > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
            <span className="text-gray-900 dark:text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Queue Map */}
      <div className="border-t border-gray-200 dark:border-gray-700/50 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MapPin size={16} className="text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Queue Map</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {queueData.position && Array.from({ length: Math.min(queueData.totalInQueue, 10) }, (_, i) => {
            const pos = i + 1;
            const isYou = pos === queueData.position;
            const isPassed = pos < queueData.position;
            const isCurrent = pos === (queueData.currentServing || 0);

            return (
              <div
                key={i}
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 ring-offset-2 scale-110'
                    : isYou
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-300 ring-offset-2 scale-110 animate-pulse'
                    : isPassed
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {pos}
              </div>
            );
          })}
          {queueData.totalInQueue > 10 && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              +{queueData.totalInQueue - 10}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


