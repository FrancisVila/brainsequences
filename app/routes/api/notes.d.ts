import type { Request } from '@remix-run/node';

export declare function loader(): Promise<Response>;
export declare function action(args: { request: Request }): Promise<Response>;
