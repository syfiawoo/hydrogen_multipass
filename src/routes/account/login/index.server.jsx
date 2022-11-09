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

export async function api(request, {session, queryShop}) {
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
      const gen = multipassify.generate(
        customerInfo,
        // @ts-ignore
        Oxygen.env.PUBLIC_STORE_DOMAIN,
        request,
      );
      if (gen.url) {
        return new Response(JSON.stringify(gen), {
          status: 200,
        });
      }
      // const {token, error} = await multipass({customer});
      // if (error) {
      //   console.log('tok err', error);
      //   return new Response(JSON.stringify({error: 'Sometthing is wrong'}), {
      //     status: 400,
      //   });
      // }
      // const response = await fetch('/account/login/multipass', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({...body}),
      // });

      // console.log('tok', token);
      // // console.log("errhere", error)
      // const {data, errors} = await queryShop({
      //   query: LOGIN_MULTIPASS_MUTATION,
      //   variables: {
      //     multipassToken: gen.token,
      //     // input: {
      //     //   email: jsonBody.email,
      //     //   password: jsonBody.password,
      //     // },
      //   },
      //   // @ts-expect-error `queryShop.cache` is not yet supported but soon will be.
      //   cache: CacheNone(),
      // });
      // if (
      //   data?.customerAccessTokenCreateWithMultipass?.customerAccessToken
      //     ?.accessToken
      // ) {
      //   await session.set(
      //     'customerAccessToken',
      //     data.customerAccessTokenCreateWithMultipass.customerAccessToken
      //       .accessToken,
      //   );

      //   return new Response(JSON.stringify(gen), {
      //     status: 200,
      //   });
      // } else {
      //   console.log('api resp', data);
      //   return new Response(
      //     JSON.stringify({
      //       error:
      //         data?.customerAccessTokenCreateWithMultipass
      //           ?.customerUserErrors ?? errors,
      //     }),
      //     {status: 401},
      //   );
      // }
    } else {
      return new Response(
        JSON.stringify({error: 'Incorrect email or password.'}),
        {status: 400},
      );
    }
  } catch (e) {
    console.log(e);
  }
}

// const LOGIN_MUTATION = gql`
//   mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
//     customerAccessTokenCreate(input: $input) {
//       customerUserErrors {
//         code
//         field
//         message
//       }
//       customerAccessToken {
//         accessToken
//         expiresAt
//       }
//     }
//   }
// `;

// const LOGIN_MULTIPASS_MUTATION = gql`
//   mutation customerAccessTokenCreateWithMultipass($multipassToken: String!) {
//     customerAccessTokenCreateWithMultipass(multipassToken: $multipassToken) {
//       customerUserErrors {
//         code
//         field
//         message
//       }
//       customerAccessToken {
//         accessToken
//         expiresAt
//       }
//     }
//   }
// `;
