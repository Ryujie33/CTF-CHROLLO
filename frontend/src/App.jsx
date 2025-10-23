
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Flag, CheckCircle, XCircle, Lock, Server, Wifi, Clock, PlayCircle, StopCircle } from 'lucide-react';

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

  // Matrix rain effect
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';
    const columns = Math.floor(window.innerWidth / 20);
    const drops = Array(columns).fill(1);

    const interval = setInterval(() => {
      setMatrixRain(drops.map((y, i) => ({
        x: i * 20,
        y: y * 20,
        char: chars[Math.floor(Math.random() * chars.length)]
      })));

      drops.forEach((y, i) => {
        if (y * 20 > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRoomTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roomId => {
          if (updated[roomId].isActive && updated[roomId].timeRemaining > 0) {
            updated[roomId].timeRemaining -= 1;
            
            // Time's up
            if (updated[roomId].timeRemaining === 0) {
              updated[roomId].isActive = false;
              terminateRoom(roomId, true);
            }
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    
    // Check if another room is active
    if (activeRoom && activeRoom !== roomId) {
      alert('Please complete or terminate the current room before starting a new one!');
      return;
    }

    setActiveRoom(roomId);
    setSelectedRoom(roomId);
    setRoomTimers({
      ...roomTimers,
      [roomId]: {
        isActive: true,
        timeRemaining: room.timeLimit,
        startTime: Date.now()
      }
    });
  };

  const terminateRoom = (roomId, timeUp = false) => {
    setRoomTimers({
      ...roomTimers,
      [roomId]: {
        ...roomTimers[roomId],
        isActive: false
      }
    });
    
    if (activeRoom === roomId) {
      setActiveRoom(null);
    }
    
    if (timeUp) {
      alert(`Time's up for ${rooms.find(r => r.id === roomId)?.name}! The session has been terminated.`);
    }
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
        // Stop timer and terminate room
        const timer = roomTimers[roomId];
        const timeSpent = room.timeLimit - (timer?.timeRemaining || 0);
        
        terminateRoom(roomId);
        
        setSubmissions({
          ...submissions,
          [roomId]: {
            submitted: true,
            correct: true,
            flag: flag,
            timeSpent: timeSpent
          }
        });

        if (!submissions[roomId]?.correct) {
          setScore(score + room.points);
        }
        
        setSelectedRoom(null);
        
        setTimeout(() => {
          alert(`🎉 Correct! Flag captured!\n\nRoom terminated. You can now proceed to the next room.`);
        }, 100);
      } else {
        setSubmissions({
          ...submissions,
          [roomId]: {
            submitted: true,
            correct: false,
            flag: flag
          }
        });
      }
    } catch (error) {
      // Fallback to client-side verification if backend is down
      const isCorrect = flag.trim() === room.flag;
      
      if (isCorrect) {
        const timer = roomTimers[roomId];
        const timeSpent = room.timeLimit - (timer?.timeRemaining || 0);
        
        terminateRoom(roomId);
        
        setSubmissions({
          ...submissions,
          [roomId]: {
            submitted: true,
            correct: true,
            flag: flag,
            timeSpent: timeSpent
          }
        });

        if (!submissions[roomId]?.correct) {
          setScore(score + room.points);
        }
        
        setSelectedRoom(null);
        
        setTimeout(() => {
          alert(`🎉 Correct! Flag captured!\n\nRoom terminated. You can now proceed to the next room.`);
        }, 100);
      } else {
        setSubmissions({
          ...submissions,
          [roomId]: {
            submitted: true,
            correct: false,
            flag: flag
          }
        });
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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

  const RoomCard = ({ room }) => {
    const submission = submissions[room.id];
    const timer = roomTimers[room.id];
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
            
            <input
              type="text"
              placeholder="Enter flag (e.g., CTF{...})"
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleSubmitFlag(room.id, e.target.value);
                  e.target.value = '';
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
                  if (confirm('Are you sure you want to terminate this session? Your timer will stop.')) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      {/* Matrix Rain Background */}
      <div className="absolute inset-0 opacity-10">
        {matrixRain.map((drop, i) => (
          <div
            key={i}
            className="absolute text-green-500 text-sm font-mono"
            style={{ left: drop.x, top: drop.y }}
          >
            {drop.char}
          </div>
        ))}
      </div>

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

          {/* Challenge Rooms */}
          <div className="grid gap-6">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} />
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