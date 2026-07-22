'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EyeOff, Send, Mic, MicOff, CheckCheck, Check, Lock, X, Paperclip, Maximize2, Play, Pause, ArrowDown, Reply } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { ThemeToggle } from '@/lib/ThemeContext';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { compressImage } from '@/lib/imageUtils';
import {
  deriveRoomKey,
  deriveRoomKeyHash,
  getAllRoomKeys,
  hashSender,
  ROOM_ID,
  MAX_AUDIO_DURATION_MS,
  STORAGE_KEY,
  PENDING_QUEUE_KEY,
  SHAKE_THRESHOLD,
  SHAKE_CONSECUTIVE_REQUIRED,
} from '@/lib/constants';

/**
 * Module-level registry of all active Audio instances.
 * Used by WhatsAppVoiceNotePlayer to pause other players when a new one starts,
 * since `new Audio()` elements are NOT in the DOM and `querySelectorAll` can't find them.
 */
const activeAudioPlayers = new Set<HTMLAudioElement>();

interface SecretVaultChatProps {
  passcode: string;
  onPanicExit: () => void;
}

interface QuotedMessage {
  id: string;
  senderPasscode: string;
  text?: string;
  image?: string;
  audio?: string;
}

interface DecryptedMessage {
  id: string;
  senderPasscode: string;
  text: string;
  image?: string;
  audio?: string;
  replyTo?: QuotedMessage;
  timestamp: number;
  delivered: boolean; // true = confirmed saved to server
  read: boolean; // true = partner acknowledged receipt
}

interface EncryptedCacheRecord {
  id: string;
  sender: string;
  encryptedPayload: string;
  timestamp: number;
}

/**
 * WhatsApp-Style Custom Voice Note Player
 * Anti-download protected: right-click disabled, drag disabled, plays inline.
 */
function WhatsAppVoiceNotePlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    activeAudioPlayers.add(audio);

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      activeAudioPlayers.delete(audio);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      activeAudioPlayers.forEach((player) => {
        if (player !== audio) {
          player.pause();
        }
      });
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2.5 bg-black/20 p-2 rounded-xl my-1 select-none border border-white/10 max-w-xs"
    >
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-xs transition active:scale-95 cursor-pointer"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-[#00a884] h-1.5 bg-zinc-700/80 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * WhatsApp-Style Swipeable Message Item with Slide-to-Reply Gesture
 */
function SwipeableMessageItem({
  msg,
  isMe,
  senderHash,
  onReply,
  onScrollToMessage,
  onPreviewImage,
}: {
  msg: DecryptedMessage;
  isMe: boolean;
  senderHash: string;
  onReply: (msg: DecryptedMessage) => void;
  onScrollToMessage: (id: string) => void;
  onPreviewImage: (src: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const touchStartXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStartXRef.current;
    if (diffX > 0 && diffX < 80) {
      setDragX(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (dragX > 35) {
      onReply(msg);
    }
    setDragX(0);
  };

  return (
    <div
      id={`msg-${msg.id}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${dragX}px)`, transition: dragX === 0 ? 'transform 0.2s ease-out' : 'none' }}
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isMe ? 'animate-msg-right' : 'animate-msg-left'} relative group`}
    >
      {/* Swipe Reply Icon Indicator */}
      {dragX > 15 && (
        <div className="absolute -left-7 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#00a884] text-white shadow-md">
          <Reply className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
          isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-zinc-100 rounded-tr-xs' : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-zinc-100 rounded-tl-xs'
        }`}
      >
        {/* Quick Hover Reply Button */}
        <button
          onClick={() => onReply(msg)}
          className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 bg-[#1f2c34] hover:bg-[#2a3942] text-zinc-400 hover:text-emerald-400 rounded-md border border-zinc-700 shadow-sm cursor-pointer"
          title="Reply"
        >
          <Reply className="w-3 h-3" />
        </button>

        {/* Embedded Quoted Message Card */}
        {msg.replyTo && (
          <div
            onClick={(e) => { e.stopPropagation(); onScrollToMessage(msg.replyTo!.id); }}
            className="bg-black/25 border-l-4 border-l-[#00a884] rounded-r-lg p-2 mb-1.5 cursor-pointer hover:bg-black/35 transition"
          >
            <div className="text-[#00a884] font-semibold text-[10px]">
              {msg.replyTo.senderPasscode === senderHash ? 'You' : 'Partner'}
            </div>
            <p className="text-zinc-300 text-xs truncate max-w-xs select-text font-sans">
              {msg.replyTo.text || (msg.replyTo.image ? '📷 Photo' : msg.replyTo.audio ? '🎤 Voice Note' : 'Message')}
            </p>
          </div>
        )}

        {/* Image Attachment — Anti-download Protected */}
        {msg.image && (
          <div
            onClick={() => onPreviewImage(msg.image || '')}
            className="relative cursor-pointer group/img mb-1.5 overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={msg.image}
              alt="Attachment"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              className="max-h-64 object-cover w-full rounded-lg border border-white/10 hover:opacity-90 transition pointer-events-auto"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition pointer-events-none">
              <Maximize2 className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
          </div>
        )}

        {/* WhatsApp Custom Inline Voice Note Player */}
        {msg.audio && <WhatsAppVoiceNotePlayer src={msg.audio} />}

        {/* Text Payload — Native Selectable & Copyable */}
        {msg.text && msg.text !== '🎤 Voice Note' && (
          <p className="leading-relaxed whitespace-pre-wrap select-text font-sans cursor-text">{msg.text}</p>
        )}

        {/* Timestamp & WhatsApp Status Checks */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-300 opacity-75 mt-1">
          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMe && (
            msg.read ? (
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            ) : msg.delivered ? (
              <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-zinc-500" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecretVaultChat({ passcode, onPanicExit }: SecretVaultChatProps) {
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewLightboxImage, setPreviewLightboxImage] = useState<string | null>(null);
  const [replyingToMsg, setReplyingToMsg] = useState<DecryptedMessage | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [partnerIsOnline, setPartnerIsOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainFeedRef = useRef<HTMLElement>(null);
  const encryptedRecordsMapRef = useRef<Map<string, EncryptedCacheRecord>>(new Map());
  const shouldAutoScrollRef = useRef(true);
  const decryptedMessagesRef = useRef<DecryptedMessage[]>([]);
  const hasRequestedMotionRef = useRef(false);

  // Recording Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const loadOlderMessagesRef = useRef<() => void>(() => {});

  const handleScroll = useCallback(() => {
    if (!mainFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainFeedRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);

    if (scrollTop < 60) {
      loadOlderMessagesRef.current();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Memoize derived keys — they never change during the component's lifetime
  const roomKey = useMemo(() => deriveRoomKey(), []);
  const roomAuthHash = useMemo(() => deriveRoomKeyHash(), []);
  const senderHash = useMemo(() => hashSender(passcode), [passcode]);

  const getSupportedAudioMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/webm',
      'audio/aac',
      'audio/ogg',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const saveEncryptedCacheToStorage = useCallback(() => {
    try {
      const records = Array.from(encryptedRecordsMapRef.current.values());
      records.sort((a, b) => a.timestamp - b.timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  const parseDecryptedPayload = (plainDataStr: string): { text: string; image?: string; audio?: string; replyTo?: QuotedMessage } => {
    if (plainDataStr.startsWith('{') && plainDataStr.endsWith('}')) {
      try {
        const parsed = JSON.parse(plainDataStr);
        return {
          text: parsed.text || '',
          image: parsed.image,
          audio: parsed.audio,
          replyTo: parsed.replyTo,
        };
      } catch {
        // Not valid JSON, treat as plain text
      }
    }
    return { text: plainDataStr };
  };

  const processEncryptedRecord = useCallback(
    async (record: EncryptedCacheRecord) => {
      try {
        const candidateKeys = getAllRoomKeys();
        const plainDataStr = await decryptMessage(record.encryptedPayload, candidateKeys);
        const { text, image, audio, replyTo } = parseDecryptedPayload(plainDataStr);

        encryptedRecordsMapRef.current.set(record.id, record);

        return {
          id: record.id,
          senderPasscode: record.sender,
          text,
          image,
          audio,
          replyTo,
          timestamp: record.timestamp,
          delivered: true,
          read: false,
        } as DecryptedMessage;
      } catch (err) {
        console.error('[Decryption Error]:', err);
        return null;
      }
    },
    []
  );

  const loadFromLocalCache = useCallback(async () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return;
      const records: EncryptedCacheRecord[] = JSON.parse(cached);
      if (!Array.isArray(records)) return;

      const decryptedList: DecryptedMessage[] = [];
      for (const record of records) {
        const decrypted = await processEncryptedRecord(record);
        if (decrypted) decryptedList.push(decrypted);
      }

      saveEncryptedCacheToStorage();
      decryptedList.sort((a, b) => a.timestamp - b.timestamp);
      setDecryptedMessages(decryptedList);
    } catch {
      // corrupted cache
    }
  }, [processEncryptedRecord, saveEncryptedCacheToStorage]);

  const emitHistoricalReadReceipts = useCallback(
    (messages: DecryptedMessage[]) => {
      if (!socketRef.current || !socketRef.current.connected) return;
      for (const msg of messages) {
        if (msg.senderPasscode !== senderHash && msg.senderPasscode !== passcode) {
          socketRef.current.emit('read_receipt', {
            roomId: ROOM_ID,
            messageId: msg.id,
            reader: senderHash,
          });
        }
      }
    },
    [passcode, senderHash]
  );

  const loadInitialPostgresMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?roomId=${ROOM_ID}&limit=30`, {
        headers: { 'x-room-auth': roomAuthHash },
      });
      if (!res.ok) {
        await loadFromLocalCache();
        return;
      }

      const data = await res.json();
      if (!data.records || !Array.isArray(data.records)) return;

      if (data.records.length < 30) {
        setHasMoreOlder(false);
      }

      const decryptedList: DecryptedMessage[] = [];
      for (const record of data.records) {
        const decrypted = await processEncryptedRecord(record);
        if (decrypted) decryptedList.push(decrypted);
      }

      decryptedList.sort((a, b) => a.timestamp - b.timestamp);

      setDecryptedMessages((prev) => {
        const map = new Map<string, DecryptedMessage>();
        prev.forEach((m) => map.set(m.id, m));
        decryptedList.forEach((m) => map.set(m.id, m));
        const merged = Array.from(map.values());
        merged.sort((a, b) => a.timestamp - b.timestamp);
        return merged;
      });

      saveEncryptedCacheToStorage();
      emitHistoricalReadReceipts(decryptedList);
    } catch (e) {
      console.error('[Postgres Load Error]:', e);
      await loadFromLocalCache();
    }
  }, [emitHistoricalReadReceipts, loadFromLocalCache, processEncryptedRecord, roomAuthHash, saveEncryptedCacheToStorage]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder || decryptedMessages.length === 0) return;

    setIsLoadingOlder(true);
    const oldestTimestamp = decryptedMessages[0].timestamp;

    try {
      const res = await fetch(`/api/messages?roomId=${ROOM_ID}&limit=30&before=${oldestTimestamp}`, {
        headers: { 'x-room-auth': roomAuthHash },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.records && Array.isArray(data.records)) {
          if (data.records.length < 30) setHasMoreOlder(false);

          const olderList: DecryptedMessage[] = [];
          for (const record of data.records) {
            const decrypted = await processEncryptedRecord(record);
            if (decrypted) olderList.push(decrypted);
          }

          if (olderList.length > 0) {
            setDecryptedMessages((prev) => {
              const map = new Map<string, DecryptedMessage>();
              olderList.forEach((m) => map.set(m.id, m));
              prev.forEach((m) => map.set(m.id, m));
              const merged = Array.from(map.values());
              merged.sort((a, b) => a.timestamp - b.timestamp);
              return merged;
            });
            saveEncryptedCacheToStorage();
          }
        }
      }
    } catch {
      // ignore cursor load failures
    } finally {
      setIsLoadingOlder(false);
    }
  }, [decryptedMessages, hasMoreOlder, isLoadingOlder, processEncryptedRecord, roomAuthHash, saveEncryptedCacheToStorage]);

  useEffect(() => {
    loadOlderMessagesRef.current = loadOlderMessages;
  }, [loadOlderMessages]);

  useEffect(() => {
    decryptedMessagesRef.current = decryptedMessages;
  }, [decryptedMessages]);

  const syncPendingQueue = useCallback(async () => {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      if (!raw) return;
      const queue: (EncryptedCacheRecord & { roomId: string })[] = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-room-auth': roomAuthHash,
        },
        body: JSON.stringify({ batch: queue }),
      });

      if (res.ok) {
        localStorage.removeItem(PENDING_QUEUE_KEY);
        setDecryptedMessages((prev) =>
          prev.map((msg) => (queue.some((q) => q.id === msg.id) ? { ...msg, delivered: true } : msg))
        );
      }
    } catch {
      // retry on next interval
    }
  }, [roomAuthHash]);

  useEffect(() => {
    void (async () => {
      await loadInitialPostgresMessages();
    })();

    const socket: Socket = io({
      path: '/api/socketio',
      auth: { roomAuthHash },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', { roomId: ROOM_ID, sender: senderHash });
      syncPendingQueue();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setPartnerIsOnline(false);
      setPartnerIsTyping(false);
    });

    socket.on('user_presence', (data: { sender: string; status: string }) => {
      if (data.sender !== senderHash) {
        setPartnerIsOnline(data.status === 'online');
      }
    });

    socket.on('user_typing_start', (data: { sender: string }) => {
      if (data.sender !== senderHash) {
        setPartnerIsTyping(true);
      }
    });

    socket.on('user_typing_stop', (data: { sender: string }) => {
      if (data.sender !== senderHash) {
        setPartnerIsTyping(false);
      }
    });

    socket.on('message_read', (data: { messageId: string }) => {
      setDecryptedMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, read: true, delivered: true } : msg))
      );
    });

    socket.on('receive_encrypted_record', async (record: EncryptedCacheRecord) => {
      const decrypted = await processEncryptedRecord(record);
      if (!decrypted) return;

      setDecryptedMessages((prev) => {
        if (prev.some((m) => m.id === decrypted.id)) {
          return prev.map((m) => (m.id === decrypted.id ? { ...decrypted, delivered: true } : m));
        }
        return [...prev, { ...decrypted, delivered: true }];
      });

      saveEncryptedCacheToStorage();

      if (decrypted.senderPasscode !== senderHash && decrypted.senderPasscode !== passcode) {
        socket.emit('read_receipt', {
          roomId: ROOM_ID,
          messageId: decrypted.id,
          reader: senderHash,
        });
      }
    });

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadInitialPostgresMessages();
        syncPendingQueue();
      }
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [loadInitialPostgresMessages, passcode, processEncryptedRecord, roomAuthHash, saveEncryptedCacheToStorage, senderHash, syncPendingQueue]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [decryptedMessages]);

  const requestIOSMotionPermission = async () => {
    if (hasRequestedMotionRef.current) return;
    hasRequestedMotionRef.current = true;
    try {
      const DeviceMotionEventTyped = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceMotionEventTyped.requestPermission === 'function') {
        await DeviceMotionEventTyped.requestPermission();
      }
    } catch {
      // Permission API not supported or denied
    }
  };

  // Device Shake Panic Trigger
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let consecutiveShakes = 0;
    let lastShakeTime = Date.now();

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const deltaX = Math.abs(acc.x - lastX);
        const deltaY = Math.abs(acc.y - lastY);
        const deltaZ = Math.abs(acc.z - lastZ);

        if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
          const now = Date.now();
          if (now - lastShakeTime < 1000) {
            consecutiveShakes++;
            if (consecutiveShakes >= SHAKE_CONSECUTIVE_REQUIRED) {
              onPanicExit();
            }
          } else {
            consecutiveShakes = 1;
          }
          lastShakeTime = now;
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onPanicExit]);

  // Double Shift & ESC Panic Triggers
  useEffect(() => {
    let lastShiftTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onPanicExit();
      } else if (e.key === 'Shift') {
        const now = Date.now();
        if (now - lastShiftTime < 400) {
          onPanicExit();
        }
        lastShiftTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPanicExit]);

  const emitTypingStatus = (isTyping: boolean) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    if (isTyping) {
      socketRef.current.emit('typing_start', { roomId: ROOM_ID, sender: senderHash });
    } else {
      socketRef.current.emit('typing_stop', { roomId: ROOM_ID, sender: senderHash });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    emitTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(false);
    }, 2000);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;
        const base64Compressed = await compressImage(rawDataUrl);
        setSelectedImage(base64Compressed);
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Failed to process photo.');
    }
    e.target.value = '';
  };

  const queueForOfflineSync = (record: EncryptedCacheRecord & { roomId: string }) => {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      if (!queue.some((item: { id: string }) => item.id === record.id)) {
        queue.push(record);
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch {
      // localStorage unavailable
    }
  };

  const sendPayload = async (payloadObj: { text?: string; image?: string; audio?: string }) => {
    setIsSending(true);
    const msgId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
    const timestamp = Date.now();

    const finalPayloadObj: { text?: string; image?: string; audio?: string; replyTo?: QuotedMessage } = {
      ...payloadObj,
    };

    if (replyingToMsg) {
      finalPayloadObj.replyTo = {
        id: replyingToMsg.id,
        senderPasscode: replyingToMsg.senderPasscode,
        text: replyingToMsg.text,
        image: replyingToMsg.image,
        audio: replyingToMsg.audio,
      };
      setReplyingToMsg(null);
    }

    let encryptedPayload = '';
    try {
      const rawString = JSON.stringify(finalPayloadObj);
      encryptedPayload = await encryptMessage(rawString, roomKey);
    } catch (err: unknown) {
      console.error('[Encryption Error]:', err);
      const errMsg = err instanceof Error ? err.message : 'Web Crypto API unavailable.';
      alert('Encryption failed: ' + errMsg);
      setIsSending(false);
      return;
    }

    const cacheRecord: EncryptedCacheRecord = {
      id: msgId,
      sender: senderHash,
      encryptedPayload,
      timestamp,
    };

    const optimisticMsg: DecryptedMessage = {
      id: msgId,
      senderPasscode: senderHash,
      text: payloadObj.text || '',
      image: payloadObj.image,
      audio: payloadObj.audio,
      replyTo: finalPayloadObj.replyTo,
      timestamp,
      delivered: false,
      read: false,
    };

    encryptedRecordsMapRef.current.set(msgId, cacheRecord);
    saveEncryptedCacheToStorage();
    setDecryptedMessages((prev) => [...prev, optimisticMsg]);

    const postBody = {
      roomId: ROOM_ID,
      sender: senderHash,
      encryptedPayload,
      id: msgId,
      timestamp,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-room-auth': roomAuthHash,
        },
        body: JSON.stringify(postBody),
      });

      if (res.ok) {
        setDecryptedMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, delivered: true } : msg))
        );
      } else {
        queueForOfflineSync({ ...cacheRecord, roomId: ROOM_ID });
      }
    } catch {
      queueForOfflineSync({ ...cacheRecord, roomId: ROOM_ID });
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_encrypted_record', {
        roomId: ROOM_ID,
        record: cacheRecord,
      });
    }

    setIsSending(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending) return;
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText.trim();
    const imageToSend = selectedImage || undefined;

    setInputText('');
    setSelectedImage(null);
    emitTypingStatus(false);

    await sendPayload({
      text: textToSend,
      image: imageToSend,
    });
  };

  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      audioTimeoutRef.current = setTimeout(() => {
        stopRecordingAudio();
      }, MAX_AUDIO_DURATION_MS);
    } catch {
      alert('Microphone permission required for voice notes.');
    }
  };

  const stopRecordingAudio = () => {
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder.mimeType || getSupportedAudioMimeType() || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioBlob.size > 0) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendPayload({
            text: '🎤 Voice Note',
            audio: base64Audio,
          });
        };
        reader.readAsDataURL(audioBlob);
      }

      setIsRecording(false);
      setRecordingSeconds(0);
    };

    try {
      mediaRecorder.stop();
    } catch {
      setIsRecording(false);
      stopRecordingAudio();
    }
  };

  const formatMessageDateHeader = (timestamp: number) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) return 'TODAY';
    if (msgDate.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const [privacyToast, setPrivacyToast] = useState(false);
  const privacyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPrivacyToast(true);
    if (privacyToastTimerRef.current) clearTimeout(privacyToastTimerRef.current);
    privacyToastTimerRef.current = setTimeout(() => setPrivacyToast(false), 2000);
  };

  return (
    <div
      onClick={requestIOSMotionPermission}
      onContextMenu={handleContextMenu}
      className="fixed inset-0 z-50 h-dvh w-screen bg-[#efeae2] dark:bg-[#0b141a] text-slate-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-colors duration-200"
    >
      {/* Privacy Toast */}
      {privacyToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#1f2c34] text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500/30 shadow-xl animate-fade-in flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Private Vault — Screen Content Protected</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#f0f2f5] dark:bg-[#1f2c34] border-b border-slate-200 dark:border-zinc-800/80 px-3.5 sm:px-4 py-2.5 shrink-0 z-30 flex items-center justify-between shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00a884] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
            S
          </div>
          <div>
            <h1 className="font-semibold text-sm text-zinc-100">Our Space</h1>
            <p className="text-[11px] font-normal leading-none mt-0.5">
              {partnerIsTyping ? (
                <span className="text-emerald-400 font-medium">typing...</span>
              ) : partnerIsOnline ? (
                <span className="text-emerald-400 font-medium">online</span>
              ) : isConnected ? (
                <span className="text-zinc-400 font-normal">offline</span>
              ) : (
                <span className="text-amber-400/90 font-normal">connecting...</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400">
          <ThemeToggle />
          <button
            onClick={onPanicExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-xs transition shadow-xs cursor-pointer"
            title="Instant Disguise"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Cover</span>
          </button>
        </div>
      </header>

      {/* Fullscreen Photo Viewer Lightbox (Anti-download Protected) */}
      {previewLightboxImage && (
        <div
          onClick={() => setPreviewLightboxImage(null)}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in cursor-zoom-out select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewLightboxImage}
            alt="Fullscreen preview"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
            className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl pointer-events-none"
          />
          <p className="text-xs text-zinc-400 mt-3">Tap anywhere to close</p>
        </div>
      )}

      {/* Main Message Feed */}
      <main
        ref={mainFeedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 min-h-0 relative"
      >
        {isLoadingOlder && (
          <div className="text-center py-2 text-xs text-[#00a884] font-medium">Loading earlier messages...</div>
        )}

        {decryptedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 max-w-xs mx-auto">
            <Lock className="w-6 h-6 text-[#00a884] mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-200">End-to-End Encrypted Chat</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Messages and attachments are private and encrypted between participants.
            </p>
          </div>
        ) : (
          decryptedMessages.map((msg, idx) => {
            const isMe = msg.senderPasscode === senderHash || msg.senderPasscode === passcode;
            const prevMsg = decryptedMessages[idx - 1];
            const showDateHeader =
              !prevMsg ||
              formatMessageDateHeader(msg.timestamp) !== formatMessageDateHeader(prevMsg.timestamp);

            return (
              <React.Fragment key={msg.id}>
                {/* WhatsApp Date Separator Badge */}
                {showDateHeader && (
                  <div className="flex justify-center my-2.5">
                    <span className="bg-[#182229] border border-zinc-800/80 text-[10px] text-zinc-400 font-medium px-3 py-0.5 rounded-md shadow-xs">
                      {formatMessageDateHeader(msg.timestamp)}
                    </span>
                  </div>
                )}

                <SwipeableMessageItem
                  msg={msg}
                  isMe={isMe}
                  senderHash={senderHash}
                  onReply={(m) => setReplyingToMsg(m)}
                  onScrollToMessage={scrollToMessage}
                  onPreviewImage={(src) => setPreviewLightboxImage(src)}
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 z-40 p-2.5 rounded-full bg-[#1f2c34] text-zinc-300 hover:text-white border border-zinc-700/80 shadow-lg transition active:scale-95 cursor-pointer"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Attachment Preview Box */}
      {selectedImage && (
        <div className="bg-[#1f2c34] px-4 py-2 border-t border-zinc-800 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Attached preview"
              className="w-10 h-10 rounded-lg object-cover border border-[#00a884]"
            />
            <span className="text-xs text-emerald-400 font-medium">Photo attached</span>
          </div>
          <button onClick={() => setSelectedImage(null)} className="text-zinc-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quoted Message Reply Preview Banner */}
      {replyingToMsg && (
        <div className="bg-[#1f2c34] border-t border-l-4 border-l-[#00a884] border-zinc-700/60 px-3.5 py-2 flex items-center justify-between text-xs animate-fade-in shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-[#00a884] font-semibold text-[11px]">
              {replyingToMsg.senderPasscode === senderHash ? 'You' : 'Partner'}
            </div>
            <p className="text-zinc-300 text-xs truncate font-sans select-text">
              {replyingToMsg.text || (replyingToMsg.image ? '📷 Photo' : replyingToMsg.audio ? '🎤 Voice Note' : 'Message')}
            </p>
          </div>
          <button
            onClick={() => setReplyingToMsg(null)}
            className="p-1 text-zinc-400 hover:text-white rounded-md transition cursor-pointer"
            title="Cancel Reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Controls Footer */}
      <footer className="bg-[#f0f2f5] dark:bg-[#1f2c34] p-2.5 sm:p-3 border-t border-slate-200 dark:border-zinc-800/80 shrink-0 z-30 transition-colors duration-200">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoSelect} className="hidden" />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Attach Photo"
          >
            <Paperclip className="w-5 h-5 text-slate-600 dark:text-zinc-300" />
          </button>

          {/* Audio Note Recorder Toggle & Timer Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecordingAudio : startRecordingAudio}
              className={`p-2 rounded-full transition cursor-pointer ${
                isRecording ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isRecording && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700/80 rounded-lg text-rose-600 dark:text-rose-400 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                <span>0:{recordingSeconds.toString().padStart(2, '0')} / 0:30</span>
              </div>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            placeholder={isRecording ? 'Recording voice note...' : 'Type a message...'}
            disabled={isRecording || isSending}
            className="flex-1 bg-white dark:bg-[#2a3942] border border-slate-300 dark:border-zinc-700/50 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-400 focus:outline-none focus:border-[#00a884] transition disabled:opacity-50 resize-none max-h-24 select-text"
          />

          <button
            type="submit"
            disabled={isRecording || isSending || (!inputText.trim() && !selectedImage)}
            className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] flex items-center justify-center text-white shadow-xs transition disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
