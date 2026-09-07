import { BadRequestException } from '@nestjs/common';
import { PageContextNormalizerService } from '../../src/host-integration/page-context-normalizer.service';

describe('PageContextNormalizerService', () => {
  const service = new PageContextNormalizerService();

  it('extracts a bounded opaque reference and excludes it from normalized PageContext', () => {
    const result = service.splitAndNormalize({
      connectorContextRef: 'ccr_Abc_123-x',
      module: 'orders',
      entityType: 'order',
      entityId: 'SO-10001'
    });

    expect(result.transient).toEqual({ connectorContextRef: 'ccr_Abc_123-x' });
    expect(result.pageContext).toEqual({ module: 'orders', entityType: 'order', entityId: 'SO-10001' });
    expect(JSON.stringify(result.pageContext)).not.toContain('connectorContextRef');
  });

  it.each([
    'ccr_',
    ' ccr_abc',
    'ccr_abc def',
    'ccr_abc.def.ghi',
    'Bearer_secret-value',
    'credential:secret',
    '{"token":"secret"}',
    `ccr_${'a'.repeat(129)}`
  ])('rejects malformed or credential-like opaque reference %s', (connectorContextRef) => {
    expect(() => service.splitAndNormalize({ connectorContextRef })).toThrow(BadRequestException);
  });

  it('keeps only fixed bounded non-authoritative hints', () => {
    const result = service.splitAndNormalize({
      module: ' orders ',
      route: '/orders/SO-10001',
      screenId: 'order-detail',
      entityType: 'order',
      entityId: 'SO-10001',
      selectedRows: [
        {
          id: 'SO-10001',
          data: {
            label: 'Order 10001',
            displayName: 'SO-10001',
            status: 'open',
            amount: 128000,
            credential: 'native-secret',
            nested: { raw: true }
          }
        },
        { data: { label: 'missing identifier' } }
      ],
      activeFilters: [
        { field: 'status', operator: 'eq', value: 'open', ignored: 'raw' },
        { field: 'amount', operator: 'gte', value: 100 },
        { field: 'customerId', operator: 'eq', value: 'customer-browser' },
        { field: 'status', value: { nested: true } }
      ],
      visibleColumns: ['status', 'customerName', '', 'status'],
      userVisibleState: {
        tab: 'summary',
        view: 'detail',
        sortBy: 'status',
        sortDirection: 'asc',
        density: 'compact',
        expandedSections: ['summary', 'history'],
        customer_id: 'customer-browser',
        metadata: { permission_scopes: ['all:write'] },
        password: 'native-secret'
      }
    });

    expect(result.pageContext).toEqual({
      module: 'orders',
      route: '/orders/SO-10001',
      screenId: 'order-detail',
      entityType: 'order',
      entityId: 'SO-10001',
      selectedRows: [
        {
          id: 'SO-10001',
          summary: { label: 'Order 10001', displayName: 'SO-10001', status: 'open' }
        }
      ],
      activeFilters: [
        { field: 'status', operator: 'eq', value: 'open' },
        { field: 'amount', operator: 'gte', value: 100 }
      ],
      visibleColumns: ['status', 'customerName'],
      userVisibleState: {
        tab: 'summary',
        view: 'detail',
        sortBy: 'status',
        sortDirection: 'asc',
        density: 'compact',
        expandedSections: ['summary', 'history']
      }
    });
    const serialized = JSON.stringify(result.pageContext);
    for (const prohibited of ['128000', 'native-secret', 'customer-browser', 'all:write', 'nested']) {
      expect(serialized).not.toContain(prohibited);
    }
  });

  it('drops raw records, nested presentation values, authority fields, and native credentials', () => {
    const result = service.splitAndNormalize({
      module: 'orders',
      selectedRows: [{ id: 'SO-10001', data: { rawRecord: { amount: 10 }, apiKey: 'sk-abcdefghijklmnop' } }],
      activeFilters: [{ field: 'connector', value: 'mock' }, { field: 'status', value: ['open'] }],
      userVisibleState: {
        organizationId: 'org-browser',
        adapter: 'browser-adapter',
        endpoint: 'https://example.test/private',
        token: 'eyJabc.def.ghi'
      }
    });

    expect(result.pageContext).toEqual({ module: 'orders', selectedRows: [{ id: 'SO-10001' }] });
  });

  it('defaults unknown Browser-declared active-filter fields to omission', () => {
    const result = service.splitAndNormalize({
      activeFilters: [
        { field: 'status', operator: 'eq', value: 'open' },
        { field: 'amount', operator: 'gte', value: 100 },
        { field: 'internalRevenue', operator: 'gte', value: 1000000 },
        { field: 'rawBusinessAmount', operator: 'gte', value: 128000 },
        { field: 'vendorContact', operator: 'contains', value: 'private@example.test' },
        { field: 'secretBusinessField', operator: 'eq', value: 'confidential' }
      ],
      visibleColumns: ['internalRevenue'],
      userVisibleState: {
        safeFields: ['rawBusinessAmount'],
        metadata: { allowedFilterFields: ['vendorContact', 'secretBusinessField'] }
      }
    });

    expect(result.pageContext?.activeFilters).toEqual([
      { field: 'status', operator: 'eq', value: 'open' },
      { field: 'amount', operator: 'gte', value: 100 }
    ]);
  });

  it('enforces balanced string and collection bounds', () => {
    expect(() => service.splitAndNormalize({ route: `/${'r'.repeat(512)}` })).toThrow(BadRequestException);
    expect(() => service.splitAndNormalize({ module: 'm'.repeat(257) })).toThrow(BadRequestException);
    expect(() =>
      service.splitAndNormalize({ selectedRows: Array.from({ length: 101 }, (_, index) => ({ id: `row-${index}` })) })
    ).toThrow(BadRequestException);
    expect(() =>
      service.splitAndNormalize({ activeFilters: Array.from({ length: 33 }, () => ({ field: 'status', value: 'open' })) })
    ).toThrow(BadRequestException);
    expect(() => service.splitAndNormalize({ visibleColumns: Array.from({ length: 65 }, (_, index) => `field-${index}`) })).toThrow(
      BadRequestException
    );
  });

  it('returns no normalized PageContext when no safe hint remains', () => {
    expect(service.splitAndNormalize(undefined)).toEqual({ pageContext: undefined, transient: {} });
    expect(service.splitAndNormalize({ userVisibleState: { customerId: 'customer-browser' } }).pageContext).toBeUndefined();
  });
});
