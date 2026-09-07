import {
  getPageEntityRef,
  getVisibleColumns,
  toPageContextAuditMetadata,
  toPageContextPersistence
} from '../../src/assistant/page-context/page-context.mapper';
import { NormalizedPageContext } from '../../src/assistant/page-context/page-context.types';

describe('page context mapper', () => {
  it('persists the supported page context shape', () => {
    expect(
      toPageContextPersistence({
        module: 'orders',
        route: '/orders/SO-10001',
        screenId: 'order-detail',
        entityType: 'order',
        entityId: 'SO-10001',
        selectedRows: [{ id: 'SO-10001' }],
        activeFilters: [{ field: 'status', value: 'open' }],
        visibleColumns: ['status', 'customerName'],
        userVisibleState: { tab: 'summary' }
      })
    ).toEqual(
      expect.objectContaining({
        module: 'orders',
        entityType: 'order',
        entityId: 'SO-10001',
        visibleColumns: ['status', 'customerName']
      })
    );
  });

  it('extracts entity refs and defaults visible columns safely', () => {
    expect(getPageEntityRef({ entityType: 'order', entityId: 'SO-10001' })).toEqual({
      entityType: 'order',
      entityId: 'SO-10001'
    });
    expect(getVisibleColumns(undefined)).toEqual(['status']);
    expect(getVisibleColumns({ visibleColumns: ['status', ''] })).toEqual(['status']);
  });

  it('minimizes audit metadata instead of returning the full page context', () => {
    const metadata = toPageContextAuditMetadata({
      module: 'orders',
      screenId: 'order-detail',
      entityType: 'order',
      entityId: 'SO-10001',
      selectedRows: [{ id: 'SO-10001', summary: { status: 'open' } }],
      activeFilters: [{ field: 'amount', value: 128000 }],
      visibleColumns: ['status', 'customerName'],
      userVisibleState: { expandedSections: ['sensitive'] }
    });

    expect(metadata).toEqual({
      module: 'orders',
      screenId: 'order-detail',
      entityType: 'order',
      entityId: 'SO-10001',
      visibleColumnCount: 2,
      selectedRowCount: 1,
      hasActiveFilters: true
    });
    expect(JSON.stringify(metadata)).not.toContain('128000');
    expect(JSON.stringify(metadata)).not.toContain('expandedSections');
  });

  it('never persists raw selected-row business data or arbitrary presentation state', () => {
    const persisted = toPageContextPersistence({
      module: 'orders',
      selectedRows: [{ id: 'SO-10001', data: { amount: 128000 } }],
      userVisibleState: { nested: { credential: 'native-secret' } }
    } as unknown as NormalizedPageContext);

    expect(JSON.stringify(persisted)).not.toContain('128000');
    expect(JSON.stringify(persisted)).not.toContain('native-secret');
  });
});
