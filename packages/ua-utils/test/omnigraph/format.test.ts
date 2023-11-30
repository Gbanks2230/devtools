import { formatEid, formatOmniPoint, formatOmniVector } from '@/omnigraph/format'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ENDPOINT_IDS } from '@layerzerolabs/test-utils'
import fc from 'fast-check'
import { pointArbitrary, vectorArbitrary } from '../__utils__/arbitraries'

describe('omnigraph/format', () => {
    describe('formatEid', () => {
        it.each(ENDPOINT_IDS)(`should format %d correctly`, (eid) => {
            expect(formatEid(eid)).toMatchSnapshot()
        })

        it('should format invalid EndpointId correctly', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fc.property(fc.anything(), (eid: any) => {
                fc.pre(!(eid in EndpointId))

                expect(formatEid(eid)).toBe(`Unknown EndpointId (${eid})`)
            })
        })
    })

    describe('formatOmniPoint', () => {
        it('should just work innit', () => {
            fc.assert(
                fc.property(pointArbitrary, (point) => {
                    expect(formatOmniPoint(point)).toBe(`[${point.address} @ ${formatEid(point.eid)}]`)
                })
            )
        })
    })

    describe('formatOmniVector', () => {
        it('should just work innit', () => {
            fc.assert(
                fc.property(vectorArbitrary, (vector) => {
                    expect(formatOmniVector(vector)).toBe(
                        `${formatOmniPoint(vector.from)} → ${formatOmniPoint(vector.to)}`
                    )
                })
            )
        })
    })
})
