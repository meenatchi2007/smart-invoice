// app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    let user = null;

    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      // Token format: mock_jwt_token_{userId}
      if (token.startsWith('mock_jwt_token_')) {
        const userId = token.replace('mock_jwt_token_', '');
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true },
          });
          if (dbUser) user = dbUser;
        } catch {}
      }
    }

    return { req, prisma, user };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
