import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './useTypedSelector';
import { setJobProgress, setWsConnected, updateAssignmentInList } from '../store/slices/assignmentsSlice';
import { fetchAssignment } from '../utils/api';
import type { WSMessage } from '../types';

export function useWebSocket(assignmentId?: string) {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
    const url = assignmentId ? `${wsUrl}?assignmentId=${assignmentId}` : wsUrl;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        dispatch(setWsConnected(true));
      };

      ws.onmessage = async (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data as string);

          if (msg.type === 'JOB_PROGRESS') {
            dispatch(setJobProgress(msg.payload));
          } else if (msg.type === 'JOB_COMPLETE') {
            dispatch(setJobProgress(msg.payload));
            // Reload assignment from API to get full paper
            if (msg.payload.assignmentId) {
              try {
                const assignment = await fetchAssignment(msg.payload.assignmentId);
                dispatch(updateAssignmentInList(assignment));
              } catch {}
            }
          } else if (msg.type === 'JOB_ERROR') {
            dispatch(setJobProgress(msg.payload));
          }
        } catch {}
      };

      ws.onclose = () => {
        dispatch(setWsConnected(false));
        // Auto-reconnect after 3s
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {}
  }, [assignmentId, dispatch]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
