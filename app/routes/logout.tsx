import { redirect } from 'react-router';
import type { Route } from './+types/logout';
import { 
  getSessionIdFromRequest, 
  deleteSession, 
  clearSessionCookie 
} from '~/server/auth.server';

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = getSessionIdFromRequest(request);
  
  if (sessionId) {
    await deleteSession(sessionId);
  }

  return redirect('/', {
    headers: {
      'Set-Cookie': clearSessionCookie(),
    },
  });
}
