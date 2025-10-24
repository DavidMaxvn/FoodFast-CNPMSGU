import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketConfig {
  url: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Create STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS(config.url),
      connectHeaders: {},
      debug: (str: string) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      config.onConnect?.();
    };

    // Use WebSocket close event to signal disconnect (cast to any for compatibility)
    (client as any).onWebSocketClose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      config.onDisconnect?.();
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      config.onError?.(frame);
    };

    client.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
      config.onError?.(error);
    };

    clientRef.current = client;
    client.activate();

    return () => {
      // Deactivate safely; no need to check non-typed properties
      client.deactivate();
    };
  }, [config.url]);

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (clientRef.current && isConnected) {
      return clientRef.current.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
          callback(message.body);
        }
      });
    }
    return null;
  };

  const publish = (destination: string, body: any) => {
    const c: any = clientRef.current as any;
    if (c && isConnected) {
      if (typeof c.publish === 'function') {
        c.publish({ destination, body: JSON.stringify(body) });
      } else if (typeof c.send === 'function') {
        // Fallback for older stomp clients
        c.send(destination, {}, JSON.stringify(body));
      }
    }
  };

  const unsubscribe = (subscription: any) => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };

  return {
    isConnected,
    subscribe,
    publish,
    unsubscribe,
    client: clientRef.current,
  };
};