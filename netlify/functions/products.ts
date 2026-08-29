import type { Handler } from '@netlify/functions';
import { getProducts } from '../../server/products.server';

export const handler: Handler = async (event) => {
  try {
    const page = Number(event.queryStringParameters?.page || 1);
    const limit = Number(event.queryStringParameters?.limit || 24);
    const category = event.queryStringParameters?.category;
    const query = event.queryStringParameters?.q;

    const result = await getProducts({ page, limit, category, query });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=1800',
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Error in Netlify function /api/products:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
};
