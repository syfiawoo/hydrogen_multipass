import {Suspense} from 'react';
import {useShopQuery, CacheLong, CacheNone, Seo, gql} from '@shopify/hydrogen';

import {AccountLoginForm} from '~/components';
import {Layout} from '~/components/index.server';
import {Multipassify} from '../../../lib/multipassify';

export default function Login({response}) {
  response.cache(CacheNone());

  const {
    data: {
      shop: {name},
    },
  } = useShopQuery({
    query: SHOP_QUERY,
    cache: CacheLong(),
    preload: '*',
  });

  return (
    <Layout>
      <Suspense>
        <Seo type="noindex" data={{title: 'Login'}} />
      </Suspense>
      <AccountLoginForm shopName={name} />
    </Layout>
  );
}

const SHOP_QUERY = gql`
  query shopInfo {
    shop {
      name
    }
  }
`;

export async function api(request, {session}) {
  if (!session) {
    return new Response('Session storage not available.', {status: 400});
  }

  const jsonBody = await request.json();

  if (!jsonBody.email || !jsonBody.password) {
    return new Response(
      JSON.stringify({error: 'Incorrect email or password.'}),
      {status: 400},
    );
  }

  try {
    const resp = await fetch(`https://c66a9a4f16c1.ngrok.io/verify_user`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonBody),
    });
    if (resp.ok) {
      const customer = {
        email: jsonBody.email,
        acceptsMarketing: true,
        return_to: `/account`,
        // ...any customer field works including firstName, tags, addresses etc
      };
      const multipassify = new Multipassify(
        // @ts-ignore
        Oxygen.env.SHOPIFY_STORE_MULTIPASS_SECRET,
      );

      const customerInfo = {
        ...customer,
        created_at: new Date().toISOString(),
        return_to: customer?.return_to,
      };

      // Generating a token for customer
      const data = multipassify.generate(
        customerInfo,
        // @ts-ignore
        Oxygen.env.PUBLIC_STORE_DOMAIN,
        request,
      );
      if (data.url) {
        return new Response(JSON.stringify(data), {
          status: 200,
        });
      } else {
        throw new Error('Missing multipass url');
      }
    } else {
      return new Response(
        JSON.stringify({error: 'Incorrect email or password.'}),
        {status: 400},
      );
    }
  } catch (error) {
    console.log(error.message);
  }
}
