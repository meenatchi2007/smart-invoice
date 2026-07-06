// graphql/client.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

const authLink = new ApolloLink((operation, forward) => {
  // Read token from localStorage on every request (works client-side only)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token || null;
      }
    } catch {}
  }

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));

  return forward(operation);
});

const httpLink = new HttpLink({ uri: '/api/graphql' });

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      FinancialSummary: {
        keyFields: [],
        merge: true,
      },
      MonthlyData: {
        keyFields: ['month'],
      },
      CategoryData: {
        keyFields: ['category'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
