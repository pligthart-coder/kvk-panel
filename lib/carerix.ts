/**
 * Carerix GraphQL API client
 */

type CarerixConfig = {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  tokenUrl: string;
};

type CarerixCompany = {
  _id: string;
  name: string;
  kvkNumber?: string;
};

type CarerixCompanySearchResult = {
  exists: boolean;
  company?: CarerixCompany;
};

/**
 * Get OAuth2 access token using client credentials flow
 */
async function getAccessToken(config: CarerixConfig): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'urn:cx/cx5Wrapper:data:manage',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Carerix access token: ${response.status} - ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error(`No access token in response: ${JSON.stringify(data)}`);
  }
  
  return data.access_token;
}

/**
 * Search for a company in Carerix by KVK number
 */
export async function searchCompanyByKvk(
  kvkNumber: string
): Promise<CarerixCompanySearchResult> {
  const config: CarerixConfig = {
    clientId: process.env.CARERIX_CLIENT_ID!,
    clientSecret: process.env.CARERIX_CLIENT_SECRET!,
    apiUrl: process.env.CARERIX_API_URL || 'https://api.carerix.io/graphql/v1/graphql',
    tokenUrl: process.env.CARERIX_TOKEN_URL || 'https://id-s2.carerix.io/auth/realms/partner4/protocol/openid-connect/token',
  };

  // Get access token
  const accessToken = await getAccessToken(config);

  // GraphQL query to search for company by KVK number
  // Note: Carerix qualifier doesn't support GraphQL variables, so we interpolate directly
  const query = `
    query SearchCompany {
      crCompanyPage(
        qualifier: "kvkNumber = '${kvkNumber}'"
      ) {
        totalElements
        items {
          _id
          name
          kvkNumber
        }
      }
    }
  `;

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Carerix GraphQL request failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Carerix GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  const companies = result.data?.crCompanyPage?.items || [];
  
  if (companies.length > 0) {
    return {
      exists: true,
      company: companies[0],
    };
  }

  return {
    exists: false,
  };
}
