import { describe, it, expect } from 'bun:test';
import type { BillingAnalysisInput } from '../agents/billing-insight.agent';
import mastra from '../../mastra.config';

describe('Billing Insight Agent', () => {
    const agent = mastra.getAgent('billingInsightAgent');

    it('should identify top performer and flag underperformers', async () => {
        const input: BillingAnalysisInput = {
            periodStart: '2024-01-01',
            periodEnd: '2024-01-31',
            campaigns: [
                {
                    name: 'Jameson Flash Sale',
                    profit: 47000,
                    revenue: 120000,
                    captures: 15,
                    belowThreshold: false,
                },
                {
                    name: 'Hennessy Weekend',
                    profit: 31000,
                    revenue: 80000,
                    captures: 8,
                    belowThreshold: false,
                },
                {
                    name: 'Tusker Happy Hour',
                    profit: 5000,
                    revenue: 30000,
                    captures: 5,
                    belowThreshold: true,
                },
            ],
            totalProfit: 83000,
            capturesCount: 28,
        };

        const response = await agent!.generate([
            {
                role: 'user',
                content: JSON.stringify(input, null, 2),
            },
        ]);

        const insight = response.text;

        expect(insight).toBeTruthy();
        expect(insight.length).toBeLessThan(600);

        expect(insight.toLowerCase()).toContain('jameson');
        expect(insight.toLowerCase()).toContain('tusker');
        expect(insight).toMatch(/\d+%/);
        expect(insight).toMatch(/kes|ksh/i);
    }, 30000);

    it('should handle all underperformers scenario', async () => {
        const input: BillingAnalysisInput = {
            periodStart: '2024-02-01',
            periodEnd: '2024-02-28',
            campaigns: [
                {
                    name: 'Low Margin Promo A',
                    profit: 3000,
                    revenue: 50000,
                    captures: 10,
                    belowThreshold: true,
                },
                {
                    name: 'Low Margin Promo B',
                    profit: 2500,
                    revenue: 35000,
                    captures: 7,
                    belowThreshold: true,
                },
            ],
            totalProfit: 5500,
            capturesCount: 17,
        };

        const response = await agent!.generate([
            {
                role: 'user',
                content: JSON.stringify(input, null, 2),
            },
        ]);

        const insight = response.text;

        expect(insight).toBeTruthy();
        expect(insight.toLowerCase()).toMatch(/threshold|margin|discount/);
    }, 30000);
});
