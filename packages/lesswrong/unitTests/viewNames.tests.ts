import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

const getQueryForRequestTerms = (terms: Record<string, unknown>) =>
  viewTermsToQuery('Users', JSON.parse(JSON.stringify(terms)), undefined, createAnonymousContext());

describe('terms.view', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    'constructor',
    'toString',
    'valueOf',
    '__proto__',
    'notAView',
  ])('builds the default query when "%s" is given as the view', (view) => {
    const defaultQuery = getQueryForRequestTerms({});
    const query = getQueryForRequestTerms({
      view,
      selector: { karma: 1 },
      options: { sort: { karma: 1 } },
      syntheticFields: { extra: 1 },
    });
    expect(query).toEqual(defaultQuery);
  });
});
