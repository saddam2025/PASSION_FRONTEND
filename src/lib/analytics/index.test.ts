import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAnalytics } from './index';
import { edgeCaseInput } from './__fixtures__/edgeCases';
import { inAcademyRange } from '@/lib/timezone';

describe('analytics definitions', () => {
  it('counts registrations and distinct customers independently for multi-enrollment people', () => {
    const result = calculateAnalytics(edgeCaseInput);
    assert.equal(result.kpis.enrollments, 7);
    assert.equal(result.kpis.uniqueCustomers, 3);
    assert.equal(result.kpis.newLeads, 4);
  });
  it('excludes pending and voided records from cash totals and subtracts confirmed refunds', () => {
    const result = calculateAnalytics(edgeCaseInput);
    assert.equal(result.kpis.collected.EGP, 10000);
    assert.equal(result.kpis.collected.USD, 12000);
    assert.equal(result.kpis.refunds.USD, 2000);
    assert.equal(result.kpis.netRevenue.USD, 10000);
    assert.equal(result.kpis.netRevenue.EGP, 10000);
  });
  it('computes partial payments and current non-cancelled outstanding while excluding null prices', () => {
    const result = calculateAnalytics(edgeCaseInput);
    assert.equal(result.kpis.partiallyPaid, 1);
    assert.equal(result.kpis.unpaid, 3);
    assert.equal(result.kpis.cancelled, 1);
    assert.equal(result.kpis.outstanding.EGP, 14000);
    assert.equal(result.kpis.outstanding.USD, 12000);
  });
  it('counts cancelled registrations in conversion denominator and reports the reached-stage funnel', () => {
    const result = calculateAnalytics(edgeCaseInput);
    assert.equal(result.kpis.conversion, 1 / 7);
    assert.deepEqual(
      result.funnel.map((stage) => stage.count),
      [7, 4, 3, 1],
    );
    assert.deepEqual(
      result.funnel.map((stage) => stage.dropOff),
      [0, 3, 1, 2],
    );
  });
  it('converts late UTC timestamps to academy-local dates before inclusive range checks', () => {
    assert.equal(inAcademyRange('2026-10-31T23:30:00Z', '2026-10-01', '2026-10-31'), false);
    assert.equal(calculateAnalytics(edgeCaseInput).kpis.enrollments, 7);
  });
  it('returns zeros and null conversion for an empty dataset', () => {
    const result = calculateAnalytics({
      ...edgeCaseInput,
      leads: [],
      enrollments: [],
      paymentRecords: [],
      courses: [],
    });
    assert.equal(result.kpis.enrollments, 0);
    assert.equal(result.kpis.netRevenue.EGP, undefined);
    assert.equal(result.kpis.conversion, null);
    assert.ok(result.timeSeries.every((point) => Number.isFinite(point.registrations)));
  });
});
