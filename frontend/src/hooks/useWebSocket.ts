import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from './useTypedSelector';
import {
  setJobProgress,
  setWsConnected,
  updateAssignmentInList,
} from '../store/slices/assignmentsSlice';

import { fetchAssignment } from '../utils/api';
import type { WSMessage } from '../types';

export function useWebSocket(assignmentId?: string) {
  const dispatch = useAppDispatch();

  const wsRef = useRef<WebSocket | null>(null);

  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      try {
        const wsUrl =
          process.env.NEXT_PUBLIC_WS_URL ||
          'ws://localhost:4001';

        const url = assignmentId
          ? `${wsUrl}?assignmentId=${assignmentId}`
          : wsUrl;

        const ws = new WebSocket(url);

        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;

          console.log('✅ WebSocket connected');

          setConnected(true);

          dispatch(setWsConnected(true));
        };

        ws.onmessage = async (event) => {
          try {
            const msg: WSMessage = JSON.parse(event.data);

            if (msg.type === 'JOB_PROGRESS') {
              dispatch(setJobProgress(msg.payload));
            }

            if (msg.type === 'JOB_COMPLETE') {
              dispatch(setJobProgress(msg.payload));

              if (msg.payload.assignmentId) {
                try {
                  const assignment = await fetchAssignment(
                    msg.payload.assignmentId
                  );

                  dispatch(
                    updateAssignmentInList(assignment)
                  );
                } catch (err) {
                  console.error(err);
                }
              }
            }

            if (msg.type === 'JOB_ERROR') {
              dispatch(setJobProgress(msg.payload));
            }
          } catch (err) {
            console.error(err);
          }
        };

        ws.onerror = () => {
          console.log('⚠️ WebSocket error');
        };

        ws.onclose = () => {
          if (!isMounted) return;

          console.log('❌ WebSocket disconnected');

          setConnected(false);

          dispatch(setWsConnected(false));

          reconnectRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (err) {
        console.error(err);
      }
    };

    connect();

    return () => {
      isMounted = false;

      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [assignmentId, dispatch]);

  return {
    wsConnected: connected,
  };
}