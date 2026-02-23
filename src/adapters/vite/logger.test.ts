import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createViteLogger } from './logger.js';

describe('createViteLogger', () => {
  let mockViteLogger: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockViteLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  describe('requestStart', () => {
    it('should log when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.requestStart('post', '/api/notify');
      expect(mockViteLogger.info).toHaveBeenCalledTimes(1);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[POST]'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/notify'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('→'),
        expect.any(Object)
      );
    });

    it('should not log when enableRequestLogging is false', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: false });
      logger.requestStart('get', '/api/health');
      expect(mockViteLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('should log method, path, status and duration when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.request('get', '/api/health', 200, 5);
      expect(mockViteLogger.info).toHaveBeenCalledTimes(1);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/200.*5ms/),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.any(Object)
      );
    });

    it('should not log when enableRequestLogging is false', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.request('post', '/api/notify', 200);
      expect(mockViteLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('socket events', () => {
    it('should log socketConnected when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.socketConnected('/api/ws');
      expect(mockViteLogger.info).toHaveBeenCalledTimes(1);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[WS]'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('connected'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/ws'),
        expect.any(Object)
      );
    });

    it('should log socketDisconnected when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.socketDisconnected('/api/ws/chat');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('disconnected'),
        expect.any(Object)
      );
    });

    it('should log socketMessageReceived with path and payload preview when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.socketMessageReceived('/api/ws', undefined, { type: 'ping' });
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('received'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('ping'),
        expect.any(Object)
      );
    });

    it('should log socketMessageEmitted when enableRequestLogging is true', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.socketMessageEmitted('/api/ws', { message: 'hi' });
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('emitted'),
        expect.any(Object)
      );
    });

    it('should not log any socket event when enableRequestLogging is false', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.socketConnected('/api/ws');
      logger.socketDisconnected('/api/ws');
      logger.socketMessageReceived('/api/ws', undefined, 'data');
      logger.socketMessageEmitted('/api/ws', {});
      expect(mockViteLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('routesRegistered', () => {
    it('should log registered routes with [vitek] tag', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.routesRegistered(
        [{ method: 'get', pattern: 'health' }, { method: 'post', pattern: 'notify' }],
        '/api'
      );
      expect(mockViteLogger.info).toHaveBeenCalledTimes(1);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registered routes'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/notify'),
        expect.any(Object)
      );
    });
  });

  describe('socketsRegistered', () => {
    it('should log registered sockets with WS and path', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.socketsRegistered(
        [{ pattern: '' }, { pattern: 'chat' }],
        '/api/ws'
      );
      expect(mockViteLogger.info).toHaveBeenCalledTimes(1);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registered sockets'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('WS'),
        expect.any(Object)
      );
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('/api/ws'),
        expect.any(Object)
      );
    });
  });

  describe('getOptions', () => {
    it('should return logging options', () => {
      const logger = createViteLogger(mockViteLogger as any, {
        level: 'debug',
        enableRequestLogging: true,
        enableRouteLogging: false,
      });
      expect(logger.getOptions()).toEqual({
        level: 'debug',
        enableRequestLogging: true,
        enableRouteLogging: false,
      });
    });
  });

  describe('routesRegistered empty', () => {
    it('should log "No routes registered" when routes array is empty', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.routesRegistered([], '/api');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No routes registered'),
        expect.any(Object)
      );
    });
  });

  describe('socketsRegistered empty', () => {
    it('should log "No sockets registered" when sockets array is empty', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.socketsRegistered([], '/api/ws');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No sockets registered'),
        expect.any(Object)
      );
    });
  });

  describe('log level filtering', () => {
    it('should not log requestStart when level is error', () => {
      const logger = createViteLogger(mockViteLogger as any, {
        level: 'error',
        enableRequestLogging: true,
      });
      logger.requestStart('get', '/api/health');
      expect(mockViteLogger.info).not.toHaveBeenCalled();
    });

    it('should log info when level is info', () => {
      const logger = createViteLogger(mockViteLogger as any, { level: 'info' });
      logger.info('test message');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('test message'),
        expect.any(Object)
      );
    });
  });

  describe('middlewareLoaded and servicesGenerated', () => {
    it('should log middlewareLoaded', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.middlewareLoaded(2);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Loaded 2 global middleware'),
        expect.any(Object)
      );
    });

    it('should log servicesGenerated', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.servicesGenerated('./src/api.services.js');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generated services'),
        expect.any(Object)
      );
    });

    it('should log typesGenerated', () => {
      const logger = createViteLogger(mockViteLogger as any);
      logger.typesGenerated('./src/api.types.ts');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generated types'),
        expect.any(Object)
      );
    });
  });

  describe('routeMatched', () => {
    it('should log when enableRouteLogging true and level debug', () => {
      const logger = createViteLogger(mockViteLogger as any, {
        level: 'debug',
        enableRouteLogging: true,
      });
      logger.routeMatched('/health', 'get');
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[ROUTE]'),
        expect.any(Object)
      );
    });

    it('should not log when level is info', () => {
      const logger = createViteLogger(mockViteLogger as any, {
        level: 'info',
        enableRouteLogging: true,
      });
      logger.routeMatched('/health', 'get');
      expect(mockViteLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('response delegates to request', () => {
    it('should call request when response is called', () => {
      const logger = createViteLogger(mockViteLogger as any, { enableRequestLogging: true });
      logger.response('post', '/api/notify', 201, 10);
      expect(mockViteLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('201'),
        expect.any(Object)
      );
    });
  });
});
