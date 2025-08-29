
import type { NextApiResponse } from 'next';





import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';



export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  res.setHeader('Allow', []);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
