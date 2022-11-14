import {Suspense} from 'react';
import {CacheNone, Seo} from '@shopify/hydrogen';

import {AccountCreateForm} from '~/components';
import {Layout} from '~/components/index.server';

export default function Register({response}) {
  response.cache(CacheNone());

  return (
    <Layout>
      <Suspense>
        <Seo type="noindex" data={{title: 'Register'}} />
      </Suspense>
      <AccountCreateForm />
    </Layout>
  );
}

export async function api(request) {
  const jsonBody = await request.json();

  if (!jsonBody.email || !jsonBody.password) {
    return new Response(
      JSON.stringify({error: 'Email and password are required'}),
      {status: 400},
    );
  }

  const resp = await fetch(`https://c66a9a4f16c1.ngrok.io/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });

  const {detail} = await resp.json();
  if (resp.ok) {
    return new Response(null, {
      status: 200,
    });
  } else {
    return new Response(
      JSON.stringify({
        error: detail ?? 'Unknown error',
      }),
      {status: 401},
    );
  }

  // const {data, errors} = await queryShop({
  //   query: CUSTOMER_CREATE_MUTATION,
  //   variables: {
  //     input: {
  //       email: jsonBody.email,
  //       password: jsonBody.password,
  //       firstName: jsonBody.firstName,
  //       lastName: jsonBody.lastName,
  //     },
  //   },
  //   // @ts-expect-error `queryShop.cache` is not yet supported but soon will be.
  //   cache: CacheNone(),
  // });

  // const errorMessage = getApiErrorMessage('customerCreate', data, errors);

  // if (
  //   !errorMessage &&
  //   data &&
  //   data.customerCreate &&
  //   data.customerCreate.customer &&
  //   data.customerCreate.customer.id
  // ) {
  //   return new Response(null, {
  //     status: 200,
  //   });
  // } else {
  //   return new Response(
  //     JSON.stringify({
  //       error: errorMessage ?? 'Unknown error',
  //     }),
  //     {status: 401},
  //   );
  // }
}

// const CUSTOMER_CREATE_MUTATION = gql`
//   mutation customerCreate($input: CustomerCreateInput!) {
//     customerCreate(input: $input) {
//       customer {
//         id
//       }
//       customerUserErrors {
//         code
//         field
//         message
//       }
//     }
//   }
// `;
