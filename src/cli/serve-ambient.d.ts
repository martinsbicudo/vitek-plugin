declare module 'connect' {
  import type { IncomingMessage, ServerResponse } from 'http';
  namespace connect {
    interface NextFunction {
      (err?: unknown): void;
    }
    interface NextHandleFunction {
      (req: IncomingMessage, res: ServerResponse, next: NextFunction): void | Promise<void>;
    }
    interface Server {
      use(fn: NextHandleFunction): Server;
      (req: IncomingMessage, res: ServerResponse, next?: NextFunction): void;
    }
  }
  function connect(): connect.Server;
  export = connect;
}

declare module 'serve-static' {
  import type { IncomingMessage, ServerResponse } from 'http';
  type NextFn = (err?: unknown) => void;
  interface ServeStaticOptions {
    fallthrough?: boolean;
  }
  function serveStatic(root: string, options?: ServeStaticOptions): (req: IncomingMessage, res: ServerResponse, next: NextFn) => void;
  export = serveStatic;
}
