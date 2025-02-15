import { useEffect, useState } from 'react';

interface DebugLog {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'warning' | 'success';
}

// Global debug logs that persist across renders
let debugLogs: DebugLog[] = [];

// Global function to add logs from anywhere
export function addDebugLog(message: string, type: DebugLog['type'] = 'info') {
  const log = {
    timestamp: Date.now(),
    message,
    type,
  };
  debugLogs = [...debugLogs, log];
  // Limit to last 100 logs
  if (debugLogs.length > 100) {
    debugLogs = debugLogs.slice(-100);
  }
}

export function DebugInfo() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      setLogs([...debugLogs]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-10 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        Debug Logs ({logs.length})
      </button>
      
      {isExpanded && (
        <div className="fixed bottom-16 right-4 w-96 max-h-[60vh] overflow-y-auto bg-gray-900 text-white p-4 rounded-lg shadow-xl">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={log.timestamp + index}
                className={`p-2 rounded ${
                  log.type === 'error' ? 'bg-red-900/50' :
                  log.type === 'warning' ? 'bg-yellow-900/50' :
                  log.type === 'success' ? 'bg-green-900/50' :
                  'bg-gray-800/50'
                }`}
              >
                <div className="text-xs opacity-50">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 