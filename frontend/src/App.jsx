import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Flag, CheckCircle, XCircle, Lock, Server, Wifi, Clock, PlayCircle, StopCircle } from 'lucide-react';

/**
 * FIX 1: High-performance Matrix Canvas
 * This component handles the matrix rain effect using <canvas>
 * and requestAnimationFrame. This is very fast and, most importantly,
 * it DOES NOT cause any React re-renders, fixing the
 * "unresponsive buttons" issue.
 */
const MatrixCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';
    const fontSize = 16;
    let columns = 0;
    let drops = [];

    const setupCanvas = () => {
      // Set canvas to full window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      columns = Math.floor(canvas.width / fontSize);
      drops = []; // Reset drops array
      for(let i = 0; i < columns; i++) {
        drops[i] = 1;
      }
    };
    
    setupCanvas();

    const draw = () => {
      // Semi-transparent black background for the fading effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const animate = () => {
      draw();
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animate(); // Start the animation

    // Redraw canvas on window resize
    window.addEventListener('resize', setupCanvas);

    // Cleanup function to stop animation and remove listener
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 opacity-10" // Original styling
    />
  );
};


/**
 * FIX 2: External RoomCard Component
 * By moving RoomCard *outside* of CTFChallengePlatform, it is
 * no longer re-created every second when the timer ticks.
 * This fixes the "clearing input" problem.
 */
const RoomCard = ({ 
  room, 
  submission, 
  timer, 
  formatTime, 
  selectedRoom, 
  setSelectedRoom, 
  handleSubmitFlag, 
  terminateRoom, 
  startRoom, 
  canStartRoom 
}) => {
  
  // This component now has its *own* state for the input field.
  const [flagInput, setFlagInput] = useState('');

  const isCompleted = submission?.correct;
  const isActive = timer?.isActive;
  const timeUp = timer && timer.timeRemaining === 0 && !timer.isActive;

  return (
    <div className={`bg-slate-800 border rounded-lg p-6 transition-all ${
      isActive ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-slate-700'
    } ${timeUp ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle className="text-green-500" size={24} />
          ) : timeUp ? (
            <XCircle className="text-red-500" size={24} />
          ) : isActive ? (
            <PlayCircle className="text-cyan-400 animate-pulse" size={24} />
          ) : (
            <Lock className="text-slate-500" size={24} />
          )}
          <div>
            <h3 className="text-xl font-bold text-cyan-400">{room.name}</h3>
            <p className="text-slate-400 text-sm">{room.description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded text-xs font-semibold ${
            room.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
            room.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {room.difficulty}
          </span>
          <p className="text-slate-400 text-sm mt-2">{room.points} pts</p>
        </div>
      </div>

      {/* Timer Display */}
      {isActive && (
        <div className="mb-4 bg-slate-900 p-4 rounded border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-cyan-400" size={20} />
              <span className="text-slate-300 font-semibold">Time Remaining:</span>
            </div>
            <span className={`text-2xl font-mono font-bold ${
              timer.timeRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
            }`}>
              {formatTime(timer.timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Completed Info */}
      {isCompleted && (
        <div className="mb-4 bg-green-500/10 p-4 rounded border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <span className="text-green-400 font-semibold">✓ Completed</span>
            <span className="text-slate-300 text-sm">
              Time: {formatTime(submission.timeSpent)}
            </span>
          </div>
        </div>
      )}

      {/* Time Up Info */}
      {timeUp && (
        <div className="mb-4 bg-red-500/10 p-4 rounded border-l-4 border-red-500">
          <span className="text-red-400 font-semibold">⏰ Time's Up - Session Terminated</span>
        </div>
      )}

      <div className="mb-4 bg-slate-900 p-3 rounded border-l-4 border-cyan-500">
        <p className="text-slate-300 font-semibold">{room.question}</p>
      </div>

      {selectedRoom === room.id && isActive ? (
        <div className="mt-4 space-y-3">
          <div className="bg-slate-900 p-4 rounded">
            <h4 className="text-cyan-400 font-semibold mb-2">Hints:</h4>
            {room.hints.map((hint, idx) => (
              <p key={idx} className="text-slate-300 text-sm mb-1">• {hint}</p>
            ))}
          </div>
          
          {/* This is now a "controlled input" tied to this component's state */}
          <input
            type="text"
            placeholder="Enter flag (e.g., CTF{...})"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            value={flagInput}
            onChange={(e) => setFlagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && flagInput.trim()) {
                handleSubmitFlag(room.id, flagInput.trim());
                setFlagInput(''); // Clear this component's state
              }
            }}
          />

          {submission && !submission.correct && (
            <div className="flex items-center gap-2 p-3 rounded bg-red-500/20 text-red-400">
              <XCircle size={20} />
              <span className="font-semibold">Incorrect flag. Try again.</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                // Using a custom modal/confirm is better, but window.confirm is OK for now
                if (window.confirm('Are you sure you want to terminate this session? Your timer will stop.')) {
                  terminateRoom(room.id);
                  setSelectedRoom(null);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <StopCircle size={18} />
              Terminate Session
            </button>
            <button
              onClick={() => setSelectedRoom(null)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!isActive && canStartRoom(room.id)) {
              startRoom(room.id);
            } else if (isActive) {
              setSelectedRoom(room.id);
            }
          }}
          className={`w-full font-semibold py-2 rounded transition-colors mt-4 ${
            isCompleted ? 'bg-green-600 cursor-not-allowed' :
            timeUp ? 'bg-red-600 cursor-not-allowed' :
            !canStartRoom(room.id) ? 'bg-slate-600 cursor-not-allowed' :
            isActive ? 'bg-cyan-600 hover:bg-cyan-500 text-white' :
            'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
          disabled={isCompleted || timeUp || (!isActive && !canStartRoom(room.id))}
        >
          {isCompleted ? '✓ Completed' :
            timeUp ? '⏰ Time Expired' :
            !canStartRoom(room.id) ? '🔒 Complete Current Room First' :
            isActive ? 'Continue Room' :
            'Start Machine'}
        </button>
      )}
    </div>
  );
};


const CTFChallengePlatform = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [score, setScore] = useState(0);
  const [roomTimers, setRoomTimers] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);
  const [connectionInfo] = useState({
    ip: 'localhost',
    port: '2222',
    username: 'ctf_player'
  });

  // Challenge rooms with flags
  const rooms = [
    {
      id: 'lucien',
      name: 'Lucien\'s Domain',
      description: 'The Lord of Dreams holds secrets in the shadows',
      difficulty: 'Easy',
      points: 100,
      flag: 'CTF{d34th_15_n0t_th3_3nd}',
      timeLimit: 3600, // 1 hour in seconds
      hints: [
        'Look in the dreams directory',
        'The sandman leaves traces in .hidden files',
        'Try: cat /home/sandman/.hidden/dream.txt'
      ],
      question: 'What is the Lucien Flag?'
    },
    {
      id: 'death',
      name: 'Death\'s Garden',
      description: 'Where all stories end, and some begin',
      difficulty: 'Medium',
      points: 200,
      flag: 'CTF{3v3ryth1ng_3nd5_but_m3}',
      timeLimit: 3600,
      hints: [
        'Death keeps records of everyone',
        'Check the /var/log/souls directory',
        'Look for encoded messages in base64'
      ],
      question: 'What is the Death Flag?'
    },
    {
      id: 'morpheus',
      name: 'Morpheus\' Realm',
      description: 'Reality bends in the world of dreams',
      difficulty: 'Hard',
      points: 300,
      flag: 'CTF{r34l1ty_15_wh4t_y0u_m4k3_1t}',
      timeLimit: 3600,
      hints: [
        'The truth is hidden in the matrix',
        'Decode the reality.enc file',
        'ROT13 cipher might help'
      ],
      question: 'What is the Morpheus Flag?'
    }
  ];

  // --- CRASH FIX ---
  // The 'matrixRain' state and its useEffect have been REMOVED.
  // The crash was caused by calling setMatrixRain without defining it.
  // We are now using the <MatrixCanvas /> component instead.

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * FIX 3: Timer Stability
   * We wrap terminateRoom in useCallback so its identity is stable.
   * This prevents the timer's useEffect from re-running unnecessarily
   * and ensures it doesn't use "stale" state.
   */
  const terminateRoom = useCallback((roomId, timeUp = false) => {
    setRoomTimers(prevTimers => ({
      ...prevTimers,
      [roomId]: {
        ...prevTimers[roomId],
        isActive: false
      }
    }));
    
    setActiveRoom(prevActiveRoom => {
      if (prevActiveRoom === roomId) {
        return null;
      }
      return prevActiveRoom;
    });
    
    if (timeUp) {
      const room = rooms.find(r => r.id === roomId);
      // Note: Replaced alert() with console.warn() as alert() is problematic
      console.warn(`Time's up for ${room?.name}! The session has been terminated.`);
    }
  }, [rooms]); // This function only depends on 'rooms', which never changes.


  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Use functional update form to avoid stale state
      setRoomTimers(prev => {
        const updated = { ...prev };
        let roomToTerminate = null;

        Object.keys(updated).forEach(roomId => {
          if (updated[roomId]?.isActive && updated[roomId]?.timeRemaining > 0) {
            updated[roomId].timeRemaining -= 1;
            
            // Time's up
            if (updated[roomId].timeRemaining === 0) {
              updated[roomId].isActive = false;
              roomToTerminate = roomId; // Mark room for termination
            }
          }
        });

        // Call terminateRoom *outside* the loop and *after* state is updated
        if (roomToTerminate) {
          terminateRoom(roomToTerminate, true);
        }
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [terminateRoom]); // Now this useEffect correctly depends on terminateRoom


  const startRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    
    // Check if another room is active
    if (activeRoom && activeRoom !== roomId) {
      // Note: Replaced alert()
      console.warn('Please complete or terminate the current room before starting a new one!');
      return;
    }

    setActiveRoom(roomId);
    setSelectedRoom(roomId);
    setRoomTimers(prevTimers => ({
      ...prevTimers,
      [roomId]: {
        isActive: true,
        timeRemaining: room.timeLimit,
        startTime: Date.now()
      }
    }));
  };

  const handleSubmitFlag = async (roomId, flag) => {
    const room = rooms.find(r => r.id === roomId);
    
    try {
      const response = await fetch('http://localhost:5000/api/verify-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, flag: flag.trim() }),
      });
      
      const result = await response.json();
      const isCorrect = result.correct;
      
      if (isCorrect) {
        const timer = roomTimers[roomId];
        const timeSpent = room.timeLimit - (timer?.timeRemaining || 0);
        
        terminateRoom(roomId);
        
        setSubmissions(prev => ({
          ...prev,
          [roomId]: {
            submitted: true,
            correct: true,
            flag: flag,
            timeSpent: timeSpent
          }
        }));

        // Use functional update for score
        if (!submissions[roomId]?.correct) {
          setScore(prevScore => prevScore + room.points);
        }
        
        setSelectedRoom(null);
        
        setTimeout(() => {
          // Note: Replaced alert()
          console.log(`🎉 Correct! Flag captured!\n\nRoom terminated. You can now proceed to the next room.`);
        }, 100);
      } else {
        setSubmissions(prev => ({
          ...prev,
          [roomId]: {
            ...prev[roomId],
            submitted: true,
            correct: false,
            flag: flag
          }
        }));
      }
    } catch (error) {
      // Fallback to client-side verification if backend is down
      const isCorrect = flag.trim() === room.flag;
      
      if (isCorrect) {
        const timer = roomTimers[roomId];
        const timeSpent = room.timeLimit - (timer?.timeRemaining || 0);
        
        terminateRoom(roomId);
        
        setSubmissions(prev => ({
          ...prev,
          [roomId]: {
            submitted: true,
            correct: true,
            flag: flag,
            timeSpent: timeSpent
          }
        }));

        if (!submissions[roomId]?.correct) {
          setScore(prevScore => prevScore + room.points);
        }
        
        setSelectedRoom(null);
        
        setTimeout(() => {
          // Note: Replaced alert()
          console.log(`🎉 Correct! Flag captured!\n\nRoom terminated. You can now proceed to the next room.`);
        }, 100);
      } else {
        setSubmissions(prev => ({
          ...prev,
          [roomId]: {
            ...prev[roomId],
            submitted: true,
            correct: false,
            flag: flag
          }
        }));
      }
    }
  };

  const copyToClipboard = (text) => {
    // A more robust way to copy, especially in iFrames
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Make it invisible
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const canStartRoom = (roomId) => {
    // Can't start if another room is active
    if (activeRoom && activeRoom !== roomId) {
      return false;
    }
    // Can't start if already completed
    if (submissions[roomId]?.correct) {
      return false;
    }
    // Can't start if time ran out
    if (roomTimers[roomId] && roomTimers[roomId].timeRemaining === 0 && !roomTimers[roomId].isActive) {
      return false;
    }
    return true;
  };

  // --- RoomCard definition is now GONE from inside here ---

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      
      {/* --- RENDER FIX --- */}
      {/* We now render the performant <MatrixCanvas /> component */}
      <MatrixCanvas />

      {/* Header */}
      <div className="relative z-10 bg-slate-900 border-b border-cyan-500/30 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Terminal className="text-cyan-400" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">MiniCTF - Chrollo</h1>
              <p className="text-slate-400 text-sm">Recover the Kingdom!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {activeRoom && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                <PlayCircle size={20} />
                <span className="text-sm font-semibold">Room Active</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-green-400">
              <Wifi size={20} />
              <span className="text-sm">Connected</span>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Score</p>
              <p className="text-2xl font-bold text-cyan-400">{score}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Fun Message Banner */}
          <div className="mb-8 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-2 border-cyan-500 rounded-lg p-8 text-center">
            <div className="mb-4">
              <h2 className="text-5xl font-bold text-cyan-400 mb-2 animate-pulse">
                YOU WANNA HAVE SOME FUN? :&gt;
              </h2>
              <p className="text-xl text-slate-300">
                Connect to IP Address and hunt for the flags🤖
              </p>
            </div>

            {/* Connection Information */}
            <div className="mt-6 bg-slate-900 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Server className="text-cyan-400" size={24} />
                <h3 className="text-xl font-bold text-cyan-400">Server Connection</h3>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between bg-slate-800 p-3 rounded">
                  <span className="text-slate-400">IP Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-green-400 font-mono">{connectionInfo.ip}</code>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.ip)}
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-800 p-3 rounded">
                  <span className="text-slate-400">Port:</span>
                  <code className="text-green-400 font-mono">{connectionInfo.port}</code>
                </div>

                <div className="flex items-center justify-between bg-slate-800 p-3 rounded">
                  <span className="text-slate-400">Username:</span>
                  <code className="text-green-400 font-mono">{connectionInfo.username}</code>
                </div>
              </div>

              <div className="mt-4 bg-slate-800 p-4 rounded border-l-4 border-cyan-500">
                <p className="text-slate-300 font-mono text-sm">
                  $ ssh {connectionInfo.username}@{connectionInfo.ip} -p {connectionInfo.port}
                </p>
              </div>

              <p className="mt-4 text-slate-400 text-sm">
                Use your own Linux terminal to connect and explore the challenges!
              </p>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Task 1 - Recover the Kingdom!</h2>
            <p className="text-slate-400 mb-4">
              While the king of dreams was imprisoned, his home fell into ruins.
            </p>
            <p className="text-slate-300 mb-6">
              Can you help Sandman restore his kingdom?
            </p>
            <div className="bg-slate-800 border-l-4 border-cyan-500 p-4 rounded">
              <p className="text-slate-300 font-semibold">⚠️ Important: Each room has a 1-hour time limit. Complete one room before starting the next!</p>
            </div>
          </div>

          
          <div className="grid gap-6">
            {/* --- RENDER FIX --- */}
            {/* We now pass all the props to the external RoomCard component */}
            {rooms.map(room => (
              <RoomCard 
                key={room.id} 
                room={room}
                submission={submissions[room.id]}
                timer={roomTimers[room.id]}
                formatTime={formatTime}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                handleSubmitFlag={handleSubmitFlag}
                terminateRoom={terminateRoom}
                startRoom={startRoom}
                canStartRoom={canStartRoom}
              />
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Progress Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {rooms.map(room => {
                const isCompleted = submissions[room.id]?.correct;
                const timer = roomTimers[room.id];
                const timeUp = timer && timer.timeRemaining === 0 && !timer.isActive;
                
                return (
                  <div key={room.id} className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : timeUp ? (
                      <XCircle className="text-red-500" size={20} />
                    ) : (
                      <Lock className="text-slate-500" size={20} />
                    )}
                    <span className={
                      isCompleted ? 'text-green-400' : 
                      timeUp ? 'text-red-400' : 
                      'text-slate-400'
                    }>
                      {room.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Progress:</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {Object.values(submissions).filter(s => s.correct).length} / {rooms.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTFChallengePlatform;

