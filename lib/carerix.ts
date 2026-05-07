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
  chamberOfCommerceNr?: string;
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
    scope: 'urn:cx/core:data/companies:read urn:cx/core:data/companies:manage',
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
    throw new Error(`Failed to get Carerix access token: ${response.status} ${error}`);
  }

  const data = await response.json();
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
    tokenUrl: process.env.CARERIX_TOKEN_URL || 'https://api.carerix.io/oauth/token',
  };

  // Get access token
  const accessToken = await getAccessToken(config);

  // GraphQL query to search for company by KVK number
  const query = `
    query SearchCompany($kvkNumber: String!) {
      crCompanyPage(
        qualifier: "chamberOfCommerceNr = '$kvkNumber'"
      ) {
        totalElements
        items {
          _id
          name
          chamberOfCommerceNr
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
      variables: { kvkNumber },
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
